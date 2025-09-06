/**
 * CLI Commands Implementation
 * Provides interactive and direct command interfaces
 */
import { CLIConfig } from '../types/index.js';
export declare class CLICommands {
    private ragEngine;
    private dbtService;
    private snowflakeService;
    private llmService;
    private config;
    constructor(config: CLIConfig);
    /**
     * Interactive mode - main workflow
     */
    interactive(): Promise<void>;
    /**
     * Search command
     */
    search(query: string): Promise<void>;
    /**
     * Test Snowflake connection
     */
    testSnowflake(): Promise<void>;
    /**
     * Analyze DBT project
     */
    analyzeDBT(): Promise<void>;
    /**
     * Display context information
     */
    private displayContext;
    /**
     * Display proposed edits
     */
    private displayEdits;
    /**
     * Execute the chosen action
     */
    private executeAction;
    /**
     * Save edits to actual files
     */
    private saveEditsToFiles;
    /**
     * Update DBT documentation
     */
    private updateDBTDocumentation;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=commands.d.ts.map