/**
 * Configuration Management
 * Handles loading and validation of CLI configuration
 */
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
export class ConfigManager {
    static instance;
    config = null;
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    /**
     * Load configuration from multiple sources
     */
    async loadConfig(configPath) {
        if (this.config) {
            return this.config;
        }
        // Try to load from file first
        if (configPath && await fs.pathExists(configPath)) {
            this.config = await this.loadFromFile(configPath);
        }
        else {
            // Try default locations
            const defaultPaths = [
                '.sql-rag.json',
                'sql-rag.config.json',
                path.join(process.env.HOME || '', '.sql-rag.json')
            ];
            for (const defaultPath of defaultPaths) {
                if (await fs.pathExists(defaultPath)) {
                    this.config = await this.loadFromFile(defaultPath);
                    break;
                }
            }
        }
        // Fall back to environment variables
        if (!this.config) {
            this.config = this.loadFromEnvironment();
        }
        // Validate configuration
        this.validateConfig(this.config);
        return this.config;
    }
    /**
     * Load configuration from file
     */
    async loadFromFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(content);
            // Merge with environment variables (env vars take precedence)
            return this.mergeWithEnvironment(config);
        }
        catch (error) {
            throw new Error(`Failed to load config from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Load configuration from environment variables
     */
    loadFromEnvironment() {
        return {
            llm: {
                provider: process.env.LLM_PROVIDER || 'openai',
                model: process.env.LLM_MODEL || 'gpt-4',
                apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
                temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : 0.1,
                maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS) : 4000
            },
            snowflake: {
                account: process.env.SNOWFLAKE_ACCOUNT || '',
                user: process.env.SNOWFLAKE_USER || '',
                password: process.env.SNOWFLAKE_PASSWORD || '',
                warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
                database: process.env.SNOWFLAKE_DATABASE || '',
                schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC'
            },
            dbt: {
                projectPath: process.env.DBT_PROJECT_PATH || process.cwd(),
                profilesDir: process.env.DBT_PROFILES_DIR,
                target: process.env.DBT_TARGET
            },
            search: {
                maxSnippetLines: process.env.SEARCH_MAX_SNIPPET_LINES ? parseInt(process.env.SEARCH_MAX_SNIPPET_LINES) : 7,
                numContextLines: process.env.SEARCH_NUM_CONTEXT_LINES ? parseInt(process.env.SEARCH_NUM_CONTEXT_LINES) : 3,
                extensions: process.env.SEARCH_EXTENSIONS ? process.env.SEARCH_EXTENSIONS.split(',') : ['.sql', '.py', '.js', '.ts', '.yml', '.yaml']
            }
        };
    }
    /**
     * Merge file config with environment variables
     */
    mergeWithEnvironment(fileConfig) {
        const envConfig = this.loadFromEnvironment();
        return {
            llm: {
                provider: process.env.LLM_PROVIDER || fileConfig.llm?.provider || envConfig.llm.provider,
                model: process.env.LLM_MODEL || fileConfig.llm?.model || envConfig.llm.model,
                apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || fileConfig.llm?.apiKey || envConfig.llm.apiKey,
                temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : (fileConfig.llm?.temperature ?? envConfig.llm.temperature),
                maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS) : (fileConfig.llm?.maxTokens ?? envConfig.llm.maxTokens)
            },
            snowflake: {
                account: process.env.SNOWFLAKE_ACCOUNT || fileConfig.snowflake?.account || envConfig.snowflake.account,
                user: process.env.SNOWFLAKE_USER || fileConfig.snowflake?.user || envConfig.snowflake.user,
                password: process.env.SNOWFLAKE_PASSWORD || fileConfig.snowflake?.password || envConfig.snowflake.password,
                warehouse: process.env.SNOWFLAKE_WAREHOUSE || fileConfig.snowflake?.warehouse || envConfig.snowflake.warehouse,
                database: process.env.SNOWFLAKE_DATABASE || fileConfig.snowflake?.database || envConfig.snowflake.database,
                schema: process.env.SNOWFLAKE_SCHEMA || fileConfig.snowflake?.schema || envConfig.snowflake.schema
            },
            dbt: {
                projectPath: process.env.DBT_PROJECT_PATH || fileConfig.dbt?.projectPath || envConfig.dbt.projectPath,
                profilesDir: process.env.DBT_PROFILES_DIR || fileConfig.dbt?.profilesDir || envConfig.dbt.profilesDir,
                target: process.env.DBT_TARGET || fileConfig.dbt?.target || envConfig.dbt.target
            },
            search: {
                ...envConfig.search,
                ...fileConfig.search
            }
        };
    }
    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];
        // Validate LLM config
        if (!config.llm.apiKey) {
            errors.push('LLM API key is required (set LLM_API_KEY or OPENAI_API_KEY environment variable)');
        }
        if (!['openai', 'anthropic'].includes(config.llm.provider)) {
            errors.push('LLM provider must be "openai" or "anthropic"');
        }
        // Validate Snowflake config
        const requiredSnowflakeFields = ['account', 'user', 'password', 'warehouse', 'database'];
        requiredSnowflakeFields.forEach(field => {
            if (!config.snowflake[field]) {
                errors.push(`Snowflake ${field} is required (set SNOWFLAKE_${field.toUpperCase()} environment variable)`);
            }
        });
        // Validate DBT config
        if (!config.dbt.projectPath) {
            errors.push('DBT project path is required');
        }
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.map(e => `- ${e}`).join('\n')}`);
        }
    }
    /**
     * Create example configuration file
     */
    async createExampleConfig(outputPath = '.sql-rag.json') {
        const exampleConfig = {
            llm: {
                provider: 'openai',
                model: 'gpt-4',
                apiKey: 'your-openai-api-key',
                temperature: 0.1,
                maxTokens: 4000
            },
            snowflake: {
                account: 'your-account',
                user: 'your-username',
                password: 'your-password',
                warehouse: 'your-warehouse',
                database: 'your-database',
                schema: 'PUBLIC'
            },
            dbt: {
                projectPath: './dbt-project',
                profilesDir: '~/.dbt',
                target: 'dev'
            },
            search: {
                maxSnippetLines: 7,
                numContextLines: 3,
                extensions: ['.sql', '.py', '.js', '.ts', '.yml', '.yaml']
            }
        };
        await fs.writeFile(outputPath, JSON.stringify(exampleConfig, null, 2), 'utf8');
        console.log(`Example configuration written to ${outputPath}`);
        console.log('Please update the values and set environment variables as needed.');
    }
    /**
     * Show current configuration (with sensitive data masked)
     */
    showConfig() {
        if (!this.config) {
            console.log('No configuration loaded');
            return;
        }
        const maskedConfig = {
            ...this.config,
            llm: {
                ...this.config.llm,
                apiKey: this.config.llm.apiKey ? '***masked***' : 'not set'
            },
            snowflake: {
                ...this.config.snowflake,
                password: this.config.snowflake.password ? '***masked***' : 'not set'
            }
        };
        console.log('Current Configuration:');
        console.log(JSON.stringify(maskedConfig, null, 2));
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }
}
//# sourceMappingURL=config.js.map