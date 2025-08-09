#!/usr/bin/env node

const yargs = require('yargs');
const chalk = require('chalk');
const { configureApiKey } = require('./config');
const { docify } = require('./generate');

async function main() {
  try {
    await yargs(process.argv.slice(2))
      .scriptName('docsmith')
      .usage('Usage: $0 <command> [options]')
      .command(
        'configure',
        'Set up API key for AI integration',
        {},
        async () => {
          console.log(chalk.blue('🔧 Setting up docsmith configuration...'));
          await configureApiKey();
        }
      )
      .command(
        'docify [url]',
        'Generate README.md for a repository',
        (yargs) => {
          return yargs
            .positional('url', {
              describe: 'GitHub repository URL',
              type: 'string',
            })
            .option('dry-run', {
              alias: 'd',
              type: 'boolean',
              description: 'Print output to console instead of writing to file',
              default: false,
            });
        },
        async (argv) => {
          console.log(chalk.blue('📚 Generating README.md...'));
          await docify(argv.url, argv.dryRun);
        }
      )
      .example('$0 configure', 'Set up your API key')
      .example('$0 docify', 'Generate README for current directory')
      .example('$0 docify --url https://github.com/user/repo', 'Generate README for remote repository')
      .example('$0 docify --dry-run', 'Preview README without writing to file')
      .help('h')
      .alias('h', 'help')
      .version()
      .demandCommand(1, chalk.red('❌ You need to specify a command. Use --help to see available commands.'))
      .parse();
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
