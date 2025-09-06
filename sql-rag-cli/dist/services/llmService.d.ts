/**
 * LLM Service for Intelligent Code Generation
 * Provides AI-powered SQL code generation and modification
 */
import { SQLEdit, SnowflakeSchema, DBTModel, LLMConfig, RAGSearchResult } from '../types/index.js';
export declare class LLMService {
    private openai;
    private config;
    constructor(config: LLMConfig);
    /**
     * Generate SQL edits based on user intent and context
     */
    generateSQLEdits(intent: string, ragResults: RAGSearchResult, schema?: SnowflakeSchema, dbtModels?: DBTModel[]): Promise<SQLEdit[]>;
    /**
     * Explain SQL code changes
     */
    explainChanges(edits: SQLEdit[]): Promise<string>;
    /**
     * Generate DBT model documentation
     */
    generateModelDocumentation(model: DBTModel, sqlContent?: string): Promise<{
        description: string;
        columnDescriptions: {
            name: string;
            description: string;
        }[];
    }>;
    /**
     * Validate and improve SQL code
     */
    improveSQLCode(sqlCode: string, issues?: string[]): Promise<{
        improvedCode: string;
        improvements: string[];
    }>;
    /**
     * Build system prompt for SQL editing
     */
    private getSystemPrompt;
    /**
     * Build edit generation prompt
     */
    private buildEditPrompt;
    /**
     * Build explanation prompt
     */
    private buildExplanationPrompt;
    /**
     * Build documentation prompt
     */
    private buildDocumentationPrompt;
    /**
     * Build improvement prompt
     */
    private buildImprovementPrompt;
    /**
     * Parse edit response from LLM
     */
    private parseEditResponse;
    /**
     * Parse documentation response
     */
    private parseDocumentationResponse;
    /**
     * Parse improvement response
     */
    private parseImprovementResponse;
}
//# sourceMappingURL=llmService.d.ts.map