/**
 * Configuration Management
 * Handles loading and validation of CLI configuration
 */
import { CLIConfig } from '../types/index.js';
export declare class ConfigManager {
    private static instance;
    private config;
    static getInstance(): ConfigManager;
    /**
     * Load configuration from multiple sources
     */
    loadConfig(configPath?: string): Promise<CLIConfig>;
    /**
     * Load configuration from file
     */
    private loadFromFile;
    /**
     * Load configuration from environment variables
     */
    private loadFromEnvironment;
    /**
     * Merge file config with environment variables
     */
    private mergeWithEnvironment;
    /**
     * Validate configuration
     */
    private validateConfig;
    /**
     * Create example configuration file
     */
    createExampleConfig(outputPath?: string): Promise<void>;
    /**
     * Show current configuration (with sensitive data masked)
     */
    showConfig(): void;
    /**
     * Get current configuration
     */
    getConfig(): CLIConfig | null;
}
//# sourceMappingURL=config.d.ts.map