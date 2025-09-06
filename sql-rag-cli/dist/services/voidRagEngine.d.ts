/**
 * Enhanced RAG Engine - Extracted and adapted from Void's contextGatheringService
 * Provides intelligent code discovery with symbol analysis and context gathering
 */
import { RAGSearchResult } from '../types/index.js';
export declare class VoidRAGEngine {
    private maxSnippetLines;
    private numContextLines;
    private searchExtensions;
    private sqlParser;
    private cache;
    constructor(options?: {
        maxSnippetLines?: number;
        numContextLines?: number;
        extensions?: string[];
    });
    /**
     * Main entry point - Find relevant code using Void's intelligent search
     */
    findRelevantCode(intent: string, projectPath?: string): Promise<RAGSearchResult>;
    /**
     * Enhanced search term extraction with SQL awareness
     */
    private extractSearchTerms;
    /**
     * Multi-strategy file search using ripgrep and glob patterns
     */
    private searchForFiles;
    /**
     * Ripgrep-based content search (extracted from Void's search_for_files)
     */
    private ripgrepSearch;
    /**
     * Fallback content search when ripgrep is not available
     */
    private fallbackContentSearch;
    /**
     * Filename-based search
     */
    private filenameSearch;
    /**
     * Calculate search relevance score
     */
    private calculateSearchScore;
    /**
     * Gather context snippets around matches (extracted from Void's context gathering)
     */
    private gatherContextSnippets;
    /**
     * Create code snippet with context (adapted from Void's _getSnippetForRange)
     */
    private createSnippetFromLine;
    /**
     * Clean snippet (extracted from Void's _cleanSnippet)
     */
    private cleanSnippet;
    /**
     * Analyze SQL context from code snippet
     */
    private analyzeSQLContext;
    /**
     * Extract table names from SQL AST
     */
    private extractTablesFromAST;
    /**
     * Extract column names from SQL AST
     */
    private extractColumnsFromAST;
    /**
     * Fallback SQL analysis using regex when AST parsing fails
     */
    private fallbackSQLAnalysis;
    /**
     * Find symbol-based matches (simplified version of Void's symbol analysis)
     */
    private findSymbolMatches;
    /**
     * Rank results by relevance (enhanced from original)
     */
    private rankByRelevance;
    /**
     * Remove duplicate snippets
     */
    private deduplicateSnippets;
    /**
     * Remove duplicate file matches
     */
    private deduplicateFileMatches;
}
//# sourceMappingURL=voidRagEngine.d.ts.map