const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { GoogleGenAI } = require('@google/genai');

const { getApiKey } = require('./config');
const { fetchRepoMetadata, getCurrentRepoUrl } = require('./github');
const { analyzeLocalProject } = require('./localMeta');
const { generateAllBadges, formatBadgesMarkdown } = require('./badges');
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
function buildAIPrompt(githubData, localData, badges) {
  let prompt = `Please generate a comprehensive README.md content for this project. Use the following information to create relevant and accurate sections:

`;

  // GitHub repository information
  if (githubData) {
    prompt += `## Repository Information:
- Name: ${githubData.name}
- Full Name: ${githubData.fullName}
- Description: ${githubData.description || 'No description provided'}
- Primary Language: ${githubData.language}
- Stars: ${githubData.stars}
- Forks: ${githubData.forks}
- License: ${githubData.license || 'No license specified'}
- Topics: ${githubData.topics.length > 0 ? githubData.topics.join(', ') : 'None'}
- Homepage: ${githubData.homepageUrl || 'None'}
- Has Issues: ${githubData.hasIssues ? 'Yes' : 'No'}
- Has Wiki: ${githubData.hasWiki ? 'Yes' : 'No'}
- Has Pages: ${githubData.hasPages ? 'Yes' : 'No'}

`;
  }

  // Local project analysis
  if (localData) {
    prompt += `## Local Project Analysis:
- Project Type: ${localData.projectType}
- Base Path: ${localData.basePath}

### Project Summary:
${localData.summary.length > 0 ? localData.summary.map(s => `- ${s}`).join('\n') : '- No specific project patterns detected'}

### Detected Files:
`;

    Object.entries(localData.files).forEach(([fileName, fileData]) => {
      prompt += `\n**${fileName}:**\n`;
      
      if (fileName === 'package.json') {
        prompt += `- Name: ${fileData.name || 'Not specified'}\n`;
        prompt += `- Description: ${fileData.description || 'Not specified'}\n`;
        prompt += `- Version: ${fileData.version || 'Not specified'}\n`;
        
        if (fileData.scripts && Object.keys(fileData.scripts).length > 0) {
          prompt += `- Available scripts: ${Object.keys(fileData.scripts).join(', ')}\n`;
        }
        
        if (fileData.dependencies && fileData.dependencies.length > 0) {
          prompt += `- Dependencies: ${fileData.dependencies.length} packages\n`;
        }
      } else if (fileName === 'Makefile') {
        prompt += `- Available targets: ${fileData.targets.join(', ')}\n`;
        prompt += `- Common targets: `;
        const commonTargets = Object.entries(fileData.commonTargets)
          .filter(([_, hasTarget]) => hasTarget)
          .map(([target, _]) => target.replace('has', '').toLowerCase());
        prompt += commonTargets.length > 0 ? commonTargets.join(', ') : 'none';
        prompt += '\n';
      } else if (fileName === 'Dockerfile') {
        prompt += `- Base image: ${fileData.baseImage || 'Not specified'}\n`;
        if (fileData.exposedPort) {
          prompt += `- Exposed port: ${fileData.exposedPort}\n`;
        }
        prompt += `- Has entrypoint: ${fileData.hasEntrypoint ? 'Yes' : 'No'}\n`;
      } else if (fileName === 'requirements.txt') {
        prompt += `- Python dependencies: ${fileData.dependencies.length} packages\n`;
      } else if (fileName === 'setup.py') {
        prompt += `- Package name: ${fileData.name || 'Not specified'}\n`;
        prompt += `- Version: ${fileData.version || 'Not specified'}\n`;
        prompt += `- Author: ${fileData.author || 'Not specified'}\n`;
      } else if (fileName === 'Cargo.toml') {
        prompt += `- Package name: ${fileData.name || 'Not specified'}\n`;
        prompt += `- Version: ${fileData.version || 'Not specified'}\n`;
        prompt += `- Rust edition: ${fileData.edition || 'Not specified'}\n`;
      }
    });
  }

  // Instructions for AI
  prompt += `

## Instructions:
Please generate a professional README.md that includes the following sections (adapt based on the project type and available information):

1. **Project Title** - Use the repository name or package name
2. **Description** - A compelling description based on the repository description and detected project type
3. **Features** - List key features based on the project analysis (be specific and realistic)
4. **Prerequisites** - List any requirements based on detected technologies
5. **Installation** - Provide installation instructions based on the project type:
   - For Node.js projects: npm/yarn installation
   - For Python projects: pip installation or virtual environment setup
   - For Rust projects: cargo build instructions
   - For Dockerized projects: Docker instructions
   - Use Makefile targets if available
6. **Usage** - Provide usage examples based on:
   - Available npm scripts
   - Makefile targets
   - Docker usage if Dockerfile is present
   - Command-line usage if it's a CLI tool
7. **API Documentation** - If the project appears to be a library or API
8. **Contributing** - Standard contributing guidelines
9. **License** - Reference the detected license

## Important Guidelines:
- Write in a professional, clear, and engaging tone
- Be specific about installation and usage instructions
- Don't invent features that aren't evident from the analysis
- Use appropriate markdown formatting
- Include code blocks for installation and usage examples
- Make the content informative and helpful for developers
- If certain information is missing, provide placeholder text or general guidance
- Focus on making the README useful for someone discovering the project for the first time

DO NOT include the badges in your response - they will be prepended automatically.

Generate only the README content, starting with the project title as an H1 header.`;

  return prompt;
}

/**
 * Call the AI service to generate README content
 */
async function generateReadmeContent(githubData, localData, badges) {
  try {
    printInfo('Generating README content with AI...');
    
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildAIPrompt(githubData, localData, badges);
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
async function docify(url = null, isDryRun = false) {
  try {
    let githubData = null;
    let localData = null;
    let workingDir = process.cwd();
    
    console.log(chalk.blue('🔍 Analyzing project...'));
    
    // Determine the data source
    if (url) {
      // Remote repository mode
      printInfo(`Fetching data from: ${url}`);
      githubData = await fetchRepoMetadata(url);
      
      // Also try to analyze local directory if it's a git repo
      if (await isGitRepository()) {
        try {
          const currentRepoUrl = await getCurrentRepoUrl();
          // Check if local repo matches the provided URL
          if (currentRepoUrl.includes(githubData.name)) {
            printInfo('Local directory matches remote repository, analyzing local files...');
            localData = await analyzeLocalProject(workingDir);
          }
        } catch (error) {
          console.log(chalk.gray('Could not match local repository with remote URL'));
        }
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
    const badgesMarkdown = formatBadgesMarkdown({ importantBadges, otherBadges });
    
    // Generate README content with AI
    console.log(chalk.blue('🤖 Generating README content...'));
    const readmeContent = await generateReadmeContent(githubData, localData, [...importantBadges, ...otherBadges]);
    
    // Combine badges and AI-generated content
    const finalContent = badgesMarkdown + readmeContent;
    
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
