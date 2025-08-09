const fs = require('fs').promises;
const path = require('path');
const envPaths = require('env-paths');
const inquirer = require('inquirer');
const chalk = require('chalk');

const paths = envPaths('docsmith', { suffix: '' });
const configDir = paths.config;
const configFile = path.join(configDir, 'config.json');

/**
 * Ensure the configuration directory exists
 */
async function ensureConfigDir() {
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create config directory: ${error.message}`);
  }
}

/**
 * Interactive API key configuration
 */
async function configureApiKey() {
  try {
    console.log(chalk.yellow('🔑 API Key Configuration'));
    console.log(chalk.gray('To use docsmith, you need to provide an API key for AI content generation.'));
    console.log(chalk.gray('Currently supported: Google Gemini API'));
    console.log(chalk.gray('Get your free API key at: https://makersuite.google.com/app/apikey\n'));

    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Gemini API key:',
        mask: '*',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'API key cannot be empty';
          }
          if (input.trim().length < 10) {
            return 'API key seems too short. Please check and try again.';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Save this API key securely?',
        default: true
      }
    ]);

    if (!answers.confirm) {
      console.log(chalk.yellow('⚠️  Configuration cancelled.'));
      return;
    }

    await ensureConfigDir();
    
    const config = {
      apiKey: answers.apiKey.trim(),
      configuredAt: new Date().toISOString()
    };

    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    
    console.log(chalk.green('✅ API key saved successfully!'));
    console.log(chalk.gray(`Config saved to: ${configFile}`));
    console.log(chalk.gray('You can now use "docsmith docify" to generate README files.'));
    
  } catch (error) {
    throw new Error(`Failed to configure API key: ${error.message}`);
  }
}

/**
 * Retrieve the stored API key
 */
async function getApiKey() {
  try {
    const configData = await fs.readFile(configFile, 'utf8');
    const config = JSON.parse(configData);
    
    if (!config.apiKey) {
      throw new Error('API key not found in configuration');
    }
    
    return config.apiKey;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'API key not configured. Please run "docsmith configure" first to set up your API key.'
      );
    }
    throw new Error(`Failed to read API key: ${error.message}`);
  }
}

/**
 * Check if API key is configured
 */
async function hasApiKey() {
  try {
    await getApiKey();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  configureApiKey,
  getApiKey,
  hasApiKey,
  configFile
};
