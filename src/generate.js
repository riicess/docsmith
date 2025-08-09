const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { GoogleGenAI } = require('@google/genai');

const { getApiKey } = require('./config');
const { fetchRepoMetadata, getCurrentRepoUrl, cloneRepo } = require('./github');
const { analyzeLocalProject } = require('./localMeta');
const { generateAllBadges, formatBadgesMarkdown } = require('./badges');
const { getProjectTreeAndContents } = require('./fileReader');
const tmp = require('tmp');
const fse = require('fs-extra');
const { 
  confirmOverwrite, 
  isGitRepository, 
  getCurrentDirName,
  printError,
  printSuccess,
  printInfo,
  retryWithBackoff
} = require('./utils');

/**
 * Build a comprehensive AI prompt for README generation
 */
function buildAIPrompt(githubData, localData, badges, extraPrompt = '') {
  // Gather project metadata for the prompt
  let metadataSection = '';
  if (githubData) {
    metadataSection += `GitHub Metadata:\nName: ${githubData.name}\nDescription: ${githubData.description}\nStars: ${githubData.stars}\nForks: ${githubData.forks}\nLanguage: ${githubData.language}\nLicense: ${githubData.license}\nTopics: ${(githubData.topics || []).join(', ')}\n`;
  }
  if (localData && localData.fileTree) {
    metadataSection += `\nProject Structure:\n\`\`\`\n${localData.fileTree}\n\`\`\`\n`;
  }
  if (localData && localData.fileContents) {
    metadataSection += `\nFile Contents:\n`;
    for (const [file, content] of Object.entries(localData.fileContents)) {
      const language = file.split('.').pop();
      metadataSection += `\n**${file}**\n\`\`\`${language}\n${content}\n\`\`\`\n`;
    }
  }
  let prompt = `Please generate a comprehensive README.md for this project.\n\n${metadataSection}\n- Use only the provided project metadata and files. Do not invent features or commands that are not present in the data.\n- Analyze the provided files and metadata to determine the project type (e.g., CLI tool, library, backend, frontend, website, or any other type).\n- Adapt the Usage section and other content to fit the detected project type, showing only the most relevant usage examples and instructions.\n- If the user provides extra instructions, follow them and override the default style or detail as needed.\n\nDO NOT include the badges in your response - they will be prepended automatically.\n\nGenerate only the README content, starting with the project title as an H1 header.`;
  if (extraPrompt && extraPrompt.trim()) {
    prompt += `\n\nUser extra instructions: ${extraPrompt.trim()}`;
  }
  return prompt;
}

/**
 * Call the AI service to generate README content
 */
async function generateReadmeContent(githubData, localData, badges, extraPrompt = '', debug = false) {
  try {
    printInfo('Generating README content with AI...');
    if (debug) {
      console.log('\n===== AI PROMPT DEBUG INFO =====');
      console.log('GitHub Data:', JSON.stringify(githubData, null, 2));
      console.log('Local Data:', JSON.stringify(localData, null, 2));
      const prompt = buildAIPrompt(githubData, localData, badges, extraPrompt);
      console.log('Prompt Sent to AI:\n', prompt);
      console.log('===== END DEBUG INFO =====\n');
    }
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildAIPrompt(githubData, localData, badges, extraPrompt);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    const result = response.text;
    return result;
  } catch (error) {
    if (error.message.includes('API key')) {
      throw new Error('Invalid API key. Please run "docsmith configure" to set up your API key.');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('API quota exceeded. Please try again later or check your API usage limits.');
    } else {
      throw new Error(`Failed to generate README content: ${error.message}`);
    }
  }
}

/**
 * Main docify function that orchestrates README generation
 */
async function docify(url = null, isDryRun = false, extraPrompt = '', debug = false) {
  try {
    let githubData = null;
    let localData = null;
    const workingDir = process.cwd();
    
    console.log(chalk.blue('🔍 Analyzing project...'));
    
    // Determine the data source
    if (url) {
      // Remote repository mode
      printInfo(`Fetching data from: ${url}`);
      githubData = await fetchRepoMetadata(url);

      const tempDir = tmp.dirSync({ unsafeCleanup: true });
      try {
        await cloneRepo(githubData.cloneUrl, tempDir.name);
        localData = await getProjectTreeAndContents(tempDir.name);
      } finally {
        tempDir.removeCallback();
      }
    } else {
      // Local repository mode
      if (!(await isGitRepository())) {
        throw new Error(
          'Current directory is not a Git repository and no URL was provided.\n' +
          'Please either:\n' +
          '  1. Navigate to a Git repository directory, or\n' +
          '  2. Provide a GitHub URL with --url parameter'
        );
      }
      
      try {
        const currentRepoUrl = await getCurrentRepoUrl();
        printInfo('Fetching GitHub data for local repository...');
        githubData = await fetchRepoMetadata(currentRepoUrl);
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not fetch GitHub data:'), error.message);
        console.log(chalk.gray('Proceeding with local analysis only...'));
      }
      
      printInfo('Analyzing local project files...');
      localData = await analyzeLocalProject(workingDir);
    }
    
    // Generate badges
    console.log(chalk.blue('Generating badges...'));
    const { importantBadges, otherBadges } = generateAllBadges(githubData, localData, {}); // Pass options if needed
    const badges = [...importantBadges, ...otherBadges];
    const badgesMarkdown = formatBadgesMarkdown({ importantBadges, otherBadges });
    
    // Generate README content with AI
    console.log(chalk.blue('🤖 Generating README content...'));
    const readmeContent = await generateReadmeContent(githubData, localData, badges, extraPrompt, debug);
    
    // Combine badges and AI-generated content
    const readmeLines = readmeContent.split('\n');
    readmeLines.splice(1, 0, badgesMarkdown);
    const finalContent = readmeLines.join('\n');
    
    if (isDryRun) {
      // Dry run - output to console
      console.log(chalk.green('\n📄 Generated README.md content:\n'));
      console.log(chalk.gray('='.repeat(80)));
      console.log(finalContent);
      console.log(chalk.gray('='.repeat(80)));
      console.log(chalk.blue('\n💡 This was a dry run. Use "docsmith docify" without --dry-run to save to file.'));
    } else {
      // Write to file
      const outputPath = path.join(workingDir, 'README.md');
      
      if (!(await confirmOverwrite(outputPath))) {
        console.log(chalk.yellow('⚠️  Operation cancelled by user.'));
        return;
      }
      
      await fs.writeFile(outputPath, finalContent, 'utf8');
      printSuccess(`README.md generated successfully!`);
      printInfo(`File saved to: ${outputPath}`);
      printInfo(`Content length: ${finalContent.length} characters`);
      
      if (badges.length > 0) {
        printInfo(`Generated ${badges.length} badges`);
      }
    }
    
  } catch (error) {
    printError(error.message);
    
    // Provide helpful suggestions based on error type
    if (error.message.includes('API key')) {
      console.log(chalk.gray('\n💡 Tip: Run "docsmith configure" to set up your API key'));
    } else if (error.message.includes('Git repository')) {
      console.log(chalk.gray('\n💡 Tip: Initialize a git repository with "git init" or provide a --url parameter'));
    } else if (error.message.includes('GitHub')) {
      console.log(chalk.gray('\n💡 Tip: Check if the repository URL is correct and publicly accessible'));
    }
    
    throw error;
  }
}

module.exports = {
  docify,
  generateReadmeContent,
  buildAIPrompt
};
