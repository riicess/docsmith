const inquirer = require('inquirer');
const fs = require('fs').promises;
const chalk = require('chalk');

/**
 * Ask user for confirmation before overwriting a file
 */
async function confirmOverwrite(filePath) {
  try {
    await fs.access(filePath);
    
    // File exists, ask for confirmation
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `${filePath} already exists. Overwrite it?`,
        default: false
      }
    ]);
    
    return answers.overwrite;
  } catch {
    // File doesn't exist, safe to write
    return true;
  }
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  
  return `${size} ${sizes[i]}`;
}

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize text for safe markdown usage
 */
function sanitizeMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/[*_`]/g, '\\$&') // Escape markdown special characters
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Check if current directory is a git repository
 */
async function isGitRepository() {
  const { execSync } = require('child_process');
  
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current working directory name
 */
function getCurrentDirName() {
  const path = require('path');
  return path.basename(process.cwd());
}

/**
 * Pretty print an error message
 */
function printError(message, details = null) {
  console.error(chalk.red('❌ Error:'), message);
  
  if (details) {
    console.error(chalk.gray('Details:'), details);
  }
}

/**
 * Pretty print a success message
 */
function printSuccess(message, details = null) {
  console.log(chalk.green('✅ Success:'), message);
  
  if (details) {
    console.log(chalk.gray(details));
  }
}

/**
 * Pretty print a warning message
 */
function printWarning(message, details = null) {
  console.warn(chalk.yellow('⚠️  Warning:'), message);
  
  if (details) {
    console.warn(chalk.gray(details));
  }
}

/**
 * Pretty print an info message
 */
function printInfo(message, details = null) {
  console.log(chalk.blue('ℹ️  Info:'), message);
  
  if (details) {
    console.log(chalk.gray(details));
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(chalk.yellow(`Attempt ${attempt} failed, retrying in ${delay}ms...`));
      await sleep(delay);
    }
  }
  
  throw lastError;
}

module.exports = {
  confirmOverwrite,
  formatFileSize,
  isValidUrl,
  sanitizeMarkdown,
  truncateText,
  isGitRepository,
  getCurrentDirName,
  printError,
  printSuccess,
  printWarning,
  printInfo,
  sleep,
  retryWithBackoff
};
