/**
 * Enhanced Snowflake Service
 * Provides schema-aware Snowflake integration with intelligent SQL execution
 */
import { SnowflakeSchema, SnowflakeTable, SnowflakeColumn, SQLEdit } from '../types/index.js';
export interface SnowflakeConfig {
    account: string;
    user: string;
    password: string;
    warehouse: string;
    database: string;
    schema: string;
    private_key_path?: string;
    passphrase?: string;
}
export declare class SnowflakeService {
    private config;
    private connection;
    private schemaCache;
    constructor(config: SnowflakeConfig);
    /**
     * Test Snowflake connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Get schema information with caching
     */
    getSchema(forceRefresh?: boolean): Promise<SnowflakeSchema>;
    /**
     * Execute SQL query with result formatting
     */
    executeQuery(sql: string, options?: {
        dryRun?: boolean;
        timeout?: number;
        maxRows?: number;
    }): Promise<{
        results: any[];
        rowCount: number;
        executionTime: number;
        warnings?: string[];
    }>;
    /**
     * Apply SQL edits with validation
     */
    applyEdits(edits: SQLEdit[], options?: {
        dryRun?: boolean;
        validateFirst?: boolean;
    }): Promise<{
        appliedEdits: SQLEdit[];
        failedEdits: {
            edit: SQLEdit;
            error: string;
        }[];
        totalExecutionTime: number;
    }>;
    /**
     * Validate SQL syntax
     */
    validateSQL(sql: string): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Get table suggestions based on query context
     */
    getTableSuggestions(query: string): Promise<{
        tables: SnowflakeTable[];
        columns: SnowflakeColumn[];
    }>;
    /**
     * Analyze query performance
     */
    analyzeQueryPerformance(sql: string): Promise<{
        estimatedCost: number;
        warnings: string[];
        suggestions: string[];
    }>;
    /**
     * Connect to Snowflake
     */
    private connect;
    /**
     * Disconnect from Snowflake
     */
    disconnect(): Promise<void>;
    /**
     * Execute Snowflake query with proper error handling
     */
    private executeSnowflakeQuery;
    /**
     * Get all tables in the current schema
     */
    private getTables;
    /**
     * Get columns for a specific table
     */
    private getTableColumns;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=snowflakeService.d.ts.map