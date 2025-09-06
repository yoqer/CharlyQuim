/**
 * CLI Commands Implementation
 * Provides interactive and direct command interfaces
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { VoidRAGEngine } from '../services/voidRagEngine.js';
import { DBTService } from '../services/dbtService.js';
import { SnowflakeService } from '../services/snowflakeService.js';
import { LLMService } from '../services/llmService.js';
export class CLICommands {
    ragEngine;
    dbtService;
    snowflakeService;
    llmService;
    config;
    constructor(config) {
        this.config = config;
        this.ragEngine = new VoidRAGEngine(config.search);
        this.dbtService = new DBTService(config.dbt.projectPath, {
            profilesDir: config.dbt.profilesDir,
            target: config.dbt.target
        });
        this.snowflakeService = new SnowflakeService(config.snowflake);
        this.llmService = new LLMService(config.llm);
    }
    /**
     * Interactive mode - main workflow
     */
    async interactive() {
        console.log(chalk.blue('🔍 SQL RAG CLI - Enhanced Interactive Mode\n'));
        try {
            // Step 1: Get user intent
            const { intent } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'intent',
                    message: 'What do you want to do with your SQL/DBT code?',
                    validate: input => input.trim() ? true : 'Please describe what you want to do'
                }
            ]);
            // Step 2: Discover context
            const spinner = ora('🔍 Discovering project context...').start();
            const [ragResults, dbtInfo, schema] = await Promise.all([
                this.ragEngine.findRelevantCode(intent, this.config.dbt.projectPath),
                this.dbtService.discoverProject(),
                this.snowflakeService.getSchema().catch(() => null)
            ]);
            spinner.succeed(`Found ${ragResults.snippets.length} relevant code snippets and ${dbtInfo.models.length} DBT models`);
            // Step 3: Show found context
            await this.displayContext(ragResults, dbtInfo.models, schema);
            const { shouldProceed } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'shouldProceed',
                    message: 'Do you want to proceed with generating edits?',
                    default: true
                }
            ]);
            if (!shouldProceed) {
                console.log(chalk.yellow('👋 Operation cancelled'));
                return;
            }
            // Step 4: Generate edits using LLM
            spinner.start('🤖 Generating intelligent SQL edits...');
            const relatedModels = await this.dbtService.findRelatedModels(ragResults.searchTerms);
            const edits = await this.llmService.generateSQLEdits(intent, ragResults, schema || undefined, relatedModels);
            spinner.succeed(`Generated ${edits.length} SQL edits`);
            if (edits.length === 0) {
                console.log(chalk.yellow('No edits generated. Try refining your request.'));
                return;
            }
            // Step 5: Show proposed edits
            await this.displayEdits(edits);
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        { name: '✅ Apply changes to Snowflake', value: 'apply' },
                        { name: '🧪 Dry run (validate only)', value: 'dryrun' },
                        { name: '📝 Save edits to files', value: 'save' },
                        { name: '❌ Cancel', value: 'cancel' }
                    ]
                }
            ]);
            if (action === 'cancel') {
                console.log(chalk.yellow('👋 Operation cancelled'));
                return;
            }
            // Step 6: Execute action
            await this.executeAction(action, edits, intent);
        }
        catch (error) {
            console.error(chalk.red('\\n❌ Error:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }
    /**
     * Search command
     */
    async search(query) {
        const spinner = ora('🔍 Searching...').start();
        try {
            const results = await this.ragEngine.findRelevantCode(query, this.config.dbt.projectPath);
            spinner.succeed(`Found ${results.snippets.length} results in ${results.executionTime}ms`);
            if (results.snippets.length === 0) {
                console.log(chalk.yellow('No results found. Try different search terms.'));
                return;
            }
            results.snippets.forEach((result, index) => {
                console.log(chalk.yellow(`\n--- Result ${index + 1} (Score: ${result.score.toFixed(2)}) ---`));
                console.log(chalk.gray(`File: ${result.file}:${result.lineNumber}`));
                console.log(chalk.gray(`Matched: ${result.matchedTerm}`));
                console.log(result.code);
                if (result.sqlContext) {
                    console.log(chalk.blue(`Tables: ${result.sqlContext.tables.join(', ')}`));
                    console.log(chalk.blue(`Operations: ${result.sqlContext.operations.join(', ')}`));
                }
            });
        }
        catch (error) {
            spinner.fail('Search failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        }
    }
    /**
     * Test Snowflake connection
     */
    async testSnowflake() {
        const spinner = ora('❄️ Testing Snowflake connection...').start();
        try {
            const success = await this.snowflakeService.testConnection();
            if (success) {
                spinner.succeed('Snowflake connection successful');
            }
            else {
                spinner.fail('Snowflake connection failed');
            }
        }
        catch (error) {
            spinner.fail('Snowflake connection failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        }
    }
    /**
     * Analyze DBT project
     */
    async analyzeDBT() {
        const spinner = ora('📊 Analyzing DBT project...').start();
        try {
            const { models, projectConfig } = await this.dbtService.discoverProject();
            spinner.succeed(`Analyzed DBT project: ${projectConfig.name}`);
            console.log(chalk.blue(`\nProject Summary:`));
            console.log(`- Name: ${projectConfig.name}`);
            console.log(`- Version: ${projectConfig.version || 'Not specified'}`);
            console.log(`- Models: ${models.length}`);
            const modelsByType = models.reduce((acc, model) => {
                acc[model.type] = (acc[model.type] || 0) + 1;
                return acc;
            }, {});
            Object.entries(modelsByType).forEach(([type, count]) => {
                console.log(`  - ${type}: ${count}`);
            });
            // Show top models by dependency count
            const modelsByDeps = models
                .filter(m => m.dependencies.length > 0)
                .sort((a, b) => b.dependencies.length - a.dependencies.length)
                .slice(0, 5);
            if (modelsByDeps.length > 0) {
                console.log(chalk.blue(`\nMost Connected Models:`));
                modelsByDeps.forEach(model => {
                    console.log(`- ${model.name}: ${model.dependencies.length} dependencies`);
                });
            }
        }
        catch (error) {
            spinner.fail('DBT analysis failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        }
    }
    /**
     * Display context information
     */
    async displayContext(ragResults, dbtModels, schema) {
        console.log(chalk.yellow('\n📄 Found Context:'));
        // Show code snippets
        if (ragResults.snippets.length > 0) {
            console.log(chalk.blue(`\n🔍 Code Snippets (${ragResults.snippets.length}):`));
            ragResults.snippets.slice(0, 3).forEach((snippet, index) => {
                console.log(chalk.gray(`\n--- ${index + 1}. ${path.basename(snippet.file)}:${snippet.lineNumber} (Score: ${snippet.score.toFixed(2)}) ---`));
                console.log(snippet.code.substring(0, 200) + (snippet.code.length > 200 ? '...' : ''));
            });
            if (ragResults.snippets.length > 3) {
                console.log(chalk.gray(`... and ${ragResults.snippets.length - 3} more snippets`));
            }
        }
        // Show DBT models
        if (dbtModels.length > 0) {
            console.log(chalk.blue(`\n📊 DBT Models (${dbtModels.length}):`));
            dbtModels.slice(0, 5).forEach((model) => {
                console.log(`- ${model.name} (${model.type}): ${model.description || 'No description'}`);
            });
            if (dbtModels.length > 5) {
                console.log(chalk.gray(`... and ${dbtModels.length - 5} more models`));
            }
        }
        // Show schema info
        if (schema) {
            console.log(chalk.blue(`\n❄️ Snowflake Schema:`));
            console.log(`- Database: ${schema.database}`);
            console.log(`- Schema: ${schema.schema}`);
            console.log(`- Tables: ${schema.tables.length}`);
        }
    }
    /**
     * Display proposed edits
     */
    async displayEdits(edits) {
        console.log(chalk.yellow('\n📝 Proposed Changes:'));
        edits.forEach((edit, index) => {
            console.log(chalk.blue(`\n--- Edit ${index + 1}: ${path.basename(edit.file)} ---`));
            console.log(chalk.gray(`Reason: ${edit.reason}`));
            console.log(chalk.gray(`Lines: ${edit.lineStart}-${edit.lineEnd}`));
            // Show diff-like output
            const originalLines = edit.originalCode.split('\n');
            const newLines = edit.newCode.split('\n');
            console.log(chalk.red('- Original:'));
            originalLines.slice(0, 3).forEach(line => {
                console.log(chalk.red(`  ${line}`));
            });
            if (originalLines.length > 3) {
                console.log(chalk.gray(`  ... ${originalLines.length - 3} more lines`));
            }
            console.log(chalk.green('+ New:'));
            newLines.slice(0, 3).forEach(line => {
                console.log(chalk.green(`  ${line}`));
            });
            if (newLines.length > 3) {
                console.log(chalk.gray(`  ... ${newLines.length - 3} more lines`));
            }
        });
    }
    /**
     * Execute the chosen action
     */
    async executeAction(action, edits, intent) {
        const spinner = ora();
        switch (action) {
            case 'apply':
                spinner.start('❄️ Applying changes to Snowflake...');
                try {
                    const results = await this.snowflakeService.applyEdits(edits, { validateFirst: true });
                    if (results.failedEdits.length > 0) {
                        spinner.warn(`Applied ${results.appliedEdits.length}/${edits.length} edits`);
                        console.log(chalk.yellow('\nFailed edits:'));
                        results.failedEdits.forEach(({ edit, error }) => {
                            console.log(chalk.red(`- ${edit.file}: ${error}`));
                        });
                    }
                    else {
                        spinner.succeed('All changes applied successfully');
                    }
                    // Generate explanation
                    const explanation = await this.llmService.explainChanges(results.appliedEdits);
                    console.log(chalk.blue('\n📖 Changes Summary:'));
                    console.log(explanation);
                }
                catch (error) {
                    spinner.fail('Failed to apply changes');
                    throw error;
                }
                break;
            case 'dryrun':
                spinner.start('🧪 Validating changes...');
                try {
                    const results = await this.snowflakeService.applyEdits(edits, { dryRun: true });
                    spinner.succeed('Validation completed');
                    console.log(chalk.blue('\n✅ All changes validated successfully'));
                    console.log(`Would apply ${edits.length} edits to Snowflake`);
                }
                catch (error) {
                    spinner.fail('Validation failed');
                    throw error;
                }
                break;
            case 'save':
                spinner.start('💾 Saving edits to files...');
                try {
                    await this.saveEditsToFiles(edits);
                    spinner.succeed('Edits saved to files');
                    // Update DBT documentation
                    await this.updateDBTDocumentation(edits);
                }
                catch (error) {
                    spinner.fail('Failed to save edits');
                    throw error;
                }
                break;
        }
    }
    /**
     * Save edits to actual files
     */
    async saveEditsToFiles(edits) {
        for (const edit of edits) {
            try {
                // Read the current file
                const currentContent = await fs.readFile(edit.file, 'utf8');
                // Replace the original code with new code
                const updatedContent = currentContent.replace(edit.originalCode, edit.newCode);
                // Write back to file
                await fs.writeFile(edit.file, updatedContent, 'utf8');
                console.log(chalk.green(`✅ Updated ${edit.file}`));
            }
            catch (error) {
                console.error(chalk.red(`❌ Failed to update ${edit.file}: ${error}`));
            }
        }
    }
    /**
     * Update DBT documentation
     */
    async updateDBTDocumentation(edits) {
        const modelFiles = edits.filter(edit => edit.file.includes('/models/') && edit.file.endsWith('.sql'));
        for (const edit of modelFiles) {
            try {
                const modelName = path.basename(edit.file, '.sql');
                const sqlContent = await fs.readFile(edit.file, 'utf8');
                // Generate documentation
                const model = Array.from(this.dbtService.modelsCache.values())
                    .find((m) => m.name === modelName);
                if (model) {
                    const docs = await this.llmService.generateModelDocumentation(model, sqlContent);
                    await this.dbtService.annotateModel(modelName, {
                        description: docs.description,
                        columns: docs.columnDescriptions
                    });
                    console.log(chalk.blue(`📝 Updated documentation for ${modelName}`));
                }
            }
            catch (error) {
                console.warn(chalk.yellow(`⚠️ Could not update documentation for ${edit.file}: ${error}`));
            }
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.snowflakeService.cleanup();
    }
}
//# sourceMappingURL=commands.js.map