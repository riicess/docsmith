const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { getProjectTreeAndContents } = require('./fileReader');

/**
 * Analyze local project files and extract metadata
 */
async function analyzeLocalProject(basePath = process.cwd()) {
  console.log(chalk.gray(`Analyzing project files in ${basePath}...`));
  
  const { fileTree, fileContents } = await getProjectTreeAndContents(basePath);

  const metadata = {
    basePath,
    projectType: 'unknown',
    fileTree,
    fileContents,
    summary: []
  };

  // Generate summary
  metadata.summary = generateProjectSummary(metadata);
  
  return metadata;
}

/**
 * Generate a human-readable summary of the project
 */
function generateProjectSummary(metadata) {
  const summary = [];
  
  // Project type and basic info
  if (metadata.fileContents['package.json']) {
    summary.push(`Detected node project`);
  }
  if (metadata.fileContents['requirements.txt'] || metadata.fileContents['setup.py']) {
    summary.push(`Detected python project`);
  }
  if (metadata.fileContents['Cargo.toml']) {
    summary.push(`Detected rust project`);
  }
  if (metadata.fileContents['Makefile']) {
    summary.push(`Makefile found`);
  }
  if (metadata.fileContents['Dockerfile']) {
    summary.push(`Dockerized application`);
  }
  
  return summary;
}

module.exports = {
  analyzeLocalProject,
  generateProjectSummary
};
