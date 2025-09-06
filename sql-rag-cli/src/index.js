#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { RAGCodeSearch } from './services/ragCodeSearch.js';
import { SnowflakeClient } from './services/snowflakeClient.js';
import { DBTModelAnnotator } from './services/dbtAnnotator.js';
import { SQLEditor } from './services/sqlEditor.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

// Initialize services
const ragSearch = new RAGCodeSearch();
const snowflake = new SnowflakeClient();
const dbtAnnotator = new DBTModelAnnotator();
const sqlEditor = new SQLEditor();

program
  .name('sql-rag')
  .description('CLI tool using Void\'s RAG system to find and fix SQL code')
  .version('1.0.0');

// Main interactive command
program
  .command('interactive')
  .alias('i')
  .description('Interactive mode for finding and editing SQL')
  .action(async () => {
    console.log(chalk.blue('🔍 SQL RAG CLI - Interactive Mode\n'));
    
    try {
      // Get user intent
      const { intent } = await inquirer.prompt([
        {
          type: 'input',
          name: 'intent',
          message: 'What do you want to do with your SQL code?',
          validate: input => input.trim() ? true : 'Please describe what you want to do'
        }
      ]);

      // Step 1: Find relevant code using RAG
      const spinner = ora('🔍 Searching for relevant SQL code...').start();
      const codeContext = await ragSearch.findRelevantCode(intent);
      spinner.succeed(`Found ${codeContext.length} relevant code snippets`);

      // Step 2: Show found code and get confirmation
      console.log(chalk.yellow('\n📄 Found relevant SQL code:'));
      codeContext.forEach((snippet, index) => {
        console.log(chalk.gray(`\n--- Snippet ${index + 1} (${snippet.file}) ---`));
        console.log(snippet.code);
      });

      const { shouldProceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldProceed',
          message: 'Do you want to proceed with editing this code?',
          default: true
        }
      ]);

      if (!shouldProceed) {
        console.log(chalk.yellow('👋 Operation cancelled'));
        return;
      }

      // Step 3: Generate SQL edits
      spinner.start('✏️ Generating SQL edits...');
      const edits = await sqlEditor.generateEdits(intent, codeContext);
      spinner.succeed('Generated SQL edits');

      // Step 4: Show edits and get confirmation
      console.log(chalk.yellow('\n📝 Proposed changes:'));
      edits.forEach((edit, index) => {
        console.log(chalk.gray(`\n--- Edit ${index + 1} (${edit.file}) ---`));
        console.log(chalk.red('- ' + edit.originalCode));
        console.log(chalk.green('+ ' + edit.newCode));
      });

      const { shouldApply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldApply',
          message: 'Do you want to apply these changes?',
          default: true
        }
      ]);

      if (!shouldApply) {
        console.log(chalk.yellow('👋 Changes not applied'));
        return;
      }

      // Step 5: Apply to Snowflake
      spinner.start('❄️ Applying changes to Snowflake...');
      const snowflakeResults = await snowflake.applyChanges(edits);
      spinner.succeed('Applied changes to Snowflake');

      // Step 6: Update DBT models
      spinner.start('📊 Updating DBT model annotations...');
      await dbtAnnotator.updateModels(edits, snowflakeResults);
      spinner.succeed('Updated DBT models');

      console.log(chalk.green('\n✅ All done! Your SQL code has been updated.'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Search only command
program
  .command('search <query>')
  .description('Search for SQL code using RAG')
  .action(async (query) => {
    const spinner = ora('🔍 Searching...').start();
    try {
      const results = await ragSearch.findRelevantCode(query);
      spinner.succeed(`Found ${results.length} results`);
      
      results.forEach((result, index) => {
        console.log(chalk.yellow(`\n--- Result ${index + 1} (${result.file}) ---`));
        console.log(result.code);
      });
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red(error.message));
    }
  });

// Test Snowflake connection
program
  .command('test-snowflake')
  .description('Test Snowflake connection')
  .action(async () => {
    const spinner = ora('❄️ Testing Snowflake connection...').start();
    try {
      await snowflake.testConnection();
      spinner.succeed('Snowflake connection successful');
    } catch (error) {
      spinner.fail('Snowflake connection failed');
      console.error(chalk.red(error.message));
    }
  });

program.parse();