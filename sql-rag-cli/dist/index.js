#!/usr/bin/env node
/**
 * SQL RAG CLI - Enhanced Version
 * Intelligent SQL code discovery and modification using Void's RAG system
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { CLICommands } from './cli/commands.js';
import { ConfigManager } from './config/config.js';
const program = new Command();
// Global error handler
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('Unhandled Promise Rejection:'), reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error(chalk.red('Uncaught Exception:'), error);
    process.exit(1);
});
async function main() {
    program
        .name('sql-rag')
        .description('Enhanced CLI tool using Void\'s RAG system for intelligent SQL code discovery and modification')
        .version('2.0.0');
    // Configuration commands
    program
        .command('init')
        .description('Create example configuration file')
        .option('-o, --output <path>', 'Output path for config file', '.sql-rag.json')
        .action(async (options) => {
        try {
            const configManager = ConfigManager.getInstance();
            await configManager.createExampleConfig(options.output);
        }
        catch (error) {
            console.error(chalk.red('Failed to create config:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    program
        .command('config')
        .description('Show current configuration')
        .option('-c, --config <path>', 'Path to configuration file')
        .action(async (options) => {
        try {
            const configManager = ConfigManager.getInstance();
            await configManager.loadConfig(options.config);
            configManager.showConfig();
        }
        catch (error) {
            console.error(chalk.red('Failed to load config:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Main commands
    program
        .command('interactive')
        .alias('i')
        .description('Interactive mode for intelligent SQL code modification')
        .option('-c, --config <path>', 'Path to configuration file')
        .action(async (options) => {
        try {
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig(options.config);
            const cli = new CLICommands(config);
            await cli.interactive();
            await cli.cleanup();
        }
        catch (error) {
            console.error(chalk.red('Interactive mode failed:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    program
        .command('search <query>')
        .description('Search for code using enhanced RAG')
        .option('-c, --config <path>', 'Path to configuration file')
        .action(async (query, options) => {
        try {
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig(options.config);
            const cli = new CLICommands(config);
            await cli.search(query);
            await cli.cleanup();
        }
        catch (error) {
            console.error(chalk.red('Search failed:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    program
        .command('test-snowflake')
        .description('Test Snowflake connection')
        .option('-c, --config <path>', 'Path to configuration file')
        .action(async (options) => {
        try {
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig(options.config);
            const cli = new CLICommands(config);
            await cli.testSnowflake();
            await cli.cleanup();
        }
        catch (error) {
            console.error(chalk.red('Snowflake test failed:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    program
        .command('analyze-dbt')
        .description('Analyze DBT project structure')
        .option('-c, --config <path>', 'Path to configuration file')
        .action(async (options) => {
        try {
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig(options.config);
            const cli = new CLICommands(config);
            await cli.analyzeDBT();
            await cli.cleanup();
        }
        catch (error) {
            console.error(chalk.red('DBT analysis failed:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Quick commands for common tasks
    program
        .command('quick-fix <intent>')
        .description('Quick SQL fix without interactive mode')
        .option('-c, --config <path>', 'Path to configuration file')
        .option('--dry-run', 'Validate only, don\'t apply changes')
        .option('--auto-apply', 'Apply changes without confirmation')
        .action(async (intent, options) => {
        try {
            const configManager = ConfigManager.getInstance();
            const config = await configManager.loadConfig(options.config);
            console.log(chalk.blue(`🚀 Quick fix: "${intent}"`));
            // This would implement a non-interactive version of the main workflow
            console.log(chalk.yellow('Quick fix mode coming soon...'));
        }
        catch (error) {
            console.error(chalk.red('Quick fix failed:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Help and examples
    program
        .command('examples')
        .description('Show usage examples')
        .action(() => {
        console.log(chalk.blue('SQL RAG CLI - Usage Examples:\n'));
        console.log(chalk.yellow('1. Initialize configuration:'));
        console.log('   sql-rag init\n');
        console.log(chalk.yellow('2. Interactive mode (recommended):'));
        console.log('   sql-rag interactive\n');
        console.log(chalk.yellow('3. Search for code:'));
        console.log('   sql-rag search "customer orders"');
        console.log('   sql-rag search "revenue calculation"\n');
        console.log(chalk.yellow('4. Test connections:'));
        console.log('   sql-rag test-snowflake');
        console.log('   sql-rag analyze-dbt\n');
        console.log(chalk.yellow('5. Environment variables:'));
        console.log('   export OPENAI_API_KEY="your-api-key"');
        console.log('   export SNOWFLAKE_ACCOUNT="your-account"');
        console.log('   export DBT_PROJECT_PATH="/path/to/dbt"\n');
        console.log(chalk.blue('Example workflow:'));
        console.log('1. Set up environment variables or create config file');
        console.log('2. Run: sql-rag interactive');
        console.log('3. Describe what you want to do in natural language');
        console.log('4. Review and apply the generated changes');
    });
    // Parse command line arguments
    await program.parseAsync(process.argv);
    // Show help if no command provided
    if (!process.argv.slice(2).length) {
        program.outputHelp();
        console.log('\n' + chalk.blue('💡 Tip: Run "sql-rag examples" to see usage examples'));
        console.log(chalk.blue('💡 Tip: Run "sql-rag init" to create a configuration file'));
    }
}
main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map