/**
 * Enhanced RAG Engine - Extracted and adapted from Void's contextGatheringService
 * Provides intelligent code discovery with symbol analysis and context gathering
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';
import pkg from 'node-sql-parser';
const { Parser } = pkg;
import {
	CodeSnippet,
	DocumentSymbol,
	IRange,
	Position,
	SymbolKind,
	SQLContext,
	RAGSearchResult
} from '../types/index.js';

export class VoidRAGEngine {
	private maxSnippetLines: number;
	private numContextLines: number;
	private searchExtensions: string[];
	private sqlParser: any;
	private cache: Map<string, CodeSnippet[]> = new Map();

	constructor(options: {
		maxSnippetLines?: number;
		numContextLines?: number;
		extensions?: string[];
	} = {}) {
		this.maxSnippetLines = options.maxSnippetLines || 7;
		this.numContextLines = options.numContextLines || 3;
		this.searchExtensions = options.extensions || ['.sql', '.py', '.js', '.ts', '.yml', '.yaml'];
		this.sqlParser = new Parser();
	}

	/**
	 * Main entry point - Find relevant code using Void's intelligent search
	 */
	async findRelevantCode(intent: string, projectPath: string = '.'): Promise<RAGSearchResult> {
		const startTime = Date.now();
		console.log(`🔍 Starting RAG search for: "${intent}"`);

		try {
			// Step 1: Extract search terms using enhanced NLP
			const searchTerms = this.extractSearchTerms(intent);
			console.log(`📝 Extracted search terms: ${searchTerms.join(', ')}`);

			// Step 2: Multi-phase search (like Void's context gathering)
			const codeSnippets: CodeSnippet[] = [];

			// Phase 1: Direct text search
			const textMatches = await this.searchForFiles(searchTerms, projectPath);

			// Phase 2: Gather context around matches
			for (const match of textMatches) {
				const snippets = await this.gatherContextSnippets(match, projectPath);
				codeSnippets.push(...snippets);
			}

			// Phase 3: Symbol-based discovery (like Void's symbol provider)
			const symbolMatches = await this.findSymbolMatches(searchTerms, codeSnippets);
			codeSnippets.push(...symbolMatches);

			// Step 3: Rank and deduplicate
			const rankedResults = this.rankByRelevance(codeSnippets, intent);
			const deduplicatedResults = this.deduplicateSnippets(rankedResults);

			const executionTime = Date.now() - startTime;
			console.log(`✅ RAG search completed in ${executionTime}ms, found ${deduplicatedResults.length} relevant snippets`);

			return {
				snippets: deduplicatedResults.slice(0, 10),
				totalScore: deduplicatedResults.reduce((sum, s) => sum + s.score, 0),
				searchTerms,
				executionTime
			};
		} catch (error) {
			console.error('❌ RAG search failed:', error);
			throw new Error(`RAG search failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Enhanced search term extraction with SQL awareness
	 */
	private extractSearchTerms(intent: string): string[] {
		const sqlKeywords = [
			'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
			'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING',
			'SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'DISTINCT'
		];

		const dbtKeywords = [
			'model', 'source', 'test', 'macro', 'snapshot', 'seed',
			'ref', 'source', 'var', 'config'
		];

		const businessTerms = intent.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(term => term.length > 2);

		const terms = new Set<string>();

		// Add business terms
		businessTerms.forEach(term => {
			if (term.length > 3) {
				terms.add(term);
			}
		});

		// Add SQL keywords found in intent
		sqlKeywords.forEach(keyword => {
			if (intent.toUpperCase().includes(keyword)) {
				terms.add(keyword.toLowerCase());
			}
		});

		// Add DBT keywords
		dbtKeywords.forEach(keyword => {
			if (intent.toLowerCase().includes(keyword)) {
				terms.add(keyword);
			}
		});

		// Add table/column-like terms (detect patterns like table.column)
		const tableColumnPattern = /(\w+)\.(\w+)/g;
		let match;
		while ((match = tableColumnPattern.exec(intent)) !== null) {
			terms.add(match[1]); // table name
			terms.add(match[2]); // column name
		}

		return Array.from(terms);
	}

	/**
	 * Multi-strategy file search using ripgrep and glob patterns
	 */
	private async searchForFiles(searchTerms: string[], projectPath: string): Promise<Array<{
		file: string;
		matchedTerm: string;
		score: number;
		lineNumber?: number;
	}>> {
		const results: Array<{ file: string; matchedTerm: string; score: number; lineNumber?: number }> = [];

		for (const term of searchTerms) {
			try {
				// Strategy 1: Use ripgrep for content search
				const rgResults = await this.ripgrepSearch(term, projectPath);
				results.push(...rgResults);

				// Strategy 2: Filename search
				const filenameResults = await this.filenameSearch(term, projectPath);
				results.push(...filenameResults);
			} catch (error) {
				console.warn(`⚠️ Search failed for term "${term}":`, error);
			}
		}

		return this.deduplicateFileMatches(results);
	}

	/**
	 * Ripgrep-based content search (extracted from Void's search_for_files)
	 */
	private async ripgrepSearch(term: string, projectPath: string): Promise<Array<{
		file: string;
		matchedTerm: string;
		score: number;
		lineNumber: number;
	}>> {
		try {
			const extensions = this.searchExtensions.map(ext => `*${ext}`).join(',');
			const rgCommand = `rg -n -i --type-add 'custom:${extensions}' -t custom "${term}" "${projectPath}"`;

			const output = execSync(rgCommand, {
				encoding: 'utf8',
				cwd: projectPath,
				timeout: 30000
			}).trim();

			if (!output) return [];

			const results: Array<{ file: string; matchedTerm: string; score: number; lineNumber: number }> = [];
			const lines = output.split('\n');

			for (const line of lines) {
				const match = line.match(/^([^:]+):(\d+):(.*)/);
				if (match) {
					const [, filePath, lineNum, content] = match;
					results.push({
						file: path.resolve(projectPath, filePath),
						matchedTerm: term,
						score: this.calculateSearchScore(term, content, filePath),
						lineNumber: parseInt(lineNum, 10)
					});
				}
			}

			return results;
		} catch (error) {
			console.warn(`Ripgrep search failed for "${term}", falling back to native search...`);
			// Fall back to native search when ripgrep is not available
			return this.fallbackContentSearch(term, projectPath);
		}
	}

	/**
	 * Fallback content search when ripgrep is not available
	 */
	private async fallbackContentSearch(term: string, projectPath: string): Promise<Array<{
		file: string;
		matchedTerm: string;
		score: number;
		lineNumber: number;
	}>> {
		try {
			const results: Array<{ file: string; matchedTerm: string; score: number; lineNumber: number }> = [];

			// Get all files with matching extensions
			const patterns = this.searchExtensions.map(ext => `**/*${ext}`);
			const allFiles: string[] = [];

			for (const pattern of patterns) {
				const files = await glob(pattern, { cwd: projectPath, absolute: true });
				allFiles.push(...files);
			}

			// Search through each file
			for (const file of allFiles) {
				try {
					const content = await fs.readFile(file, 'utf8');
					const lines = content.split('\n');

					lines.forEach((line, index) => {
						if (line.toLowerCase().includes(term.toLowerCase())) {
							results.push({
								file,
								matchedTerm: term,
								score: this.calculateSearchScore(term, line, file),
								lineNumber: index + 1
							});
						}
					});
				} catch (error) {
					// Skip files that can't be read
					continue;
				}
			}

			return results;
		} catch (error) {
			console.warn(`Fallback search failed for "${term}":`, error);
			return [];
		}
	}

	/**
	 * Filename-based search
	 */
	private async filenameSearch(term: string, projectPath: string): Promise<Array<{
		file: string;
		matchedTerm: string;
		score: number;
	}>> {
		try {
			const patterns = this.searchExtensions.map(ext => `**/*${term}*${ext}`);
			const files: string[] = [];

			for (const pattern of patterns) {
				const matches = await glob(pattern, { cwd: projectPath, absolute: true });
				files.push(...matches);
			}

			return files.map(file => ({
				file,
				matchedTerm: term,
				score: path.basename(file).toLowerCase().includes(term.toLowerCase()) ? 2.0 : 1.0
			}));
		} catch (error) {
			console.warn(`Filename search failed for "${term}":`, error);
			return [];
		}
	}

	/**
	 * Calculate search relevance score
	 */
	private calculateSearchScore(term: string, content: string, filePath: string): number {
		let score = 1.0;

		// Boost SQL files
		if (filePath.endsWith('.sql')) score += 1.0;

		// Boost DBT model files
		if (filePath.includes('/models/')) score += 0.5;

		// Boost exact matches
		if (content.toLowerCase().includes(term.toLowerCase())) score += 0.5;

		// Boost if term appears in filename
		if (path.basename(filePath).toLowerCase().includes(term.toLowerCase())) score += 0.5;

		return score;
	}

	/**
	 * Gather context snippets around matches (extracted from Void's context gathering)
	 */
	private async gatherContextSnippets(fileMatch: {
		file: string;
		matchedTerm: string;
		score: number;
		lineNumber?: number;
	}, projectPath: string): Promise<CodeSnippet[]> {
		try {
			const content = await fs.readFile(fileMatch.file, 'utf8');
			const lines = content.split('\n');
			const snippets: CodeSnippet[] = [];

			if (fileMatch.lineNumber) {
				// We have a specific line number from ripgrep
				const snippet = this.createSnippetFromLine(
					fileMatch.file,
					lines,
					fileMatch.lineNumber,
					fileMatch.matchedTerm,
					fileMatch.score
				);
				if (snippet) snippets.push(snippet);
			} else {
				// Search for all occurrences
				lines.forEach((line, index) => {
					if (line.toLowerCase().includes(fileMatch.matchedTerm.toLowerCase())) {
						const snippet = this.createSnippetFromLine(
							fileMatch.file,
							lines,
							index + 1,
							fileMatch.matchedTerm,
							fileMatch.score
						);
						if (snippet) snippets.push(snippet);
					}
				});
			}

			// Add SQL context analysis for SQL files
			for (const snippet of snippets) {
				if (fileMatch.file.endsWith('.sql')) {
					snippet.sqlContext = await this.analyzeSQLContext(snippet.code);
				}
			}

			return snippets;
		} catch (error) {
			console.warn(`Could not read file ${fileMatch.file}:`, error);
			return [];
		}
	}

	/**
	 * Create code snippet with context (adapted from Void's _getSnippetForRange)
	 */
	private createSnippetFromLine(
		filePath: string,
		lines: string[],
		centerLine: number,
		matchedTerm: string,
		baseScore: number
	): CodeSnippet | null {
		const startLine = Math.max(centerLine - this.numContextLines - 1, 0);
		const endLine = Math.min(centerLine + this.numContextLines, lines.length);

		// Enforce maximum snippet size
		const totalLines = endLine - startLine;
		const adjustedStartLine = totalLines > this.maxSnippetLines
			? endLine - this.maxSnippetLines
			: startLine;

		const snippet = lines.slice(adjustedStartLine, endLine).join('\n');
		const cleanedSnippet = this.cleanSnippet(snippet);

		if (!cleanedSnippet.trim()) return null;

		return {
			file: filePath,
			lineNumber: centerLine,
			matchedTerm,
			code: cleanedSnippet,
			score: baseScore,
			symbols: [] // Will be populated by symbol analysis if needed
		};
	}

	/**
	 * Clean snippet (extracted from Void's _cleanSnippet)
	 */
	private cleanSnippet(snippet: string): string {
		return snippet
			.split('\n')
			.filter(line => {
				const trimmed = line.trim();
				return trimmed &&
					!/^\/\/+$/.test(trimmed) &&
					!/^--+$/.test(trimmed) &&
					!/^\/\*+\*\/$/.test(trimmed);
			})
			.join('\n')
			.trim();
	}

	/**
	 * Analyze SQL context from code snippet
	 */
	private async analyzeSQLContext(sqlCode: string): Promise<SQLContext> {
		try {
			// Try to parse the SQL
			const ast = this.sqlParser.astify(sqlCode);

			const tables: string[] = [];
			const columns: string[] = [];
			const operations: string[] = [];

			// Extract table references
			this.extractTablesFromAST(ast, tables);

			// Extract column references
			this.extractColumnsFromAST(ast, columns);

			// Extract operations
			if (Array.isArray(ast)) {
				ast.forEach(stmt => {
					if (stmt && typeof stmt === 'object' && 'type' in stmt) {
						operations.push(stmt.type.toLowerCase());
					}
				});
			} else if (ast && typeof ast === 'object' && 'type' in ast) {
				operations.push(ast.type.toLowerCase());
			}

			return {
				tables: [...new Set(tables)],
				columns: [...new Set(columns)],
				operations: [...new Set(operations)],
				dependencies: [] // Will be populated by DBT analysis
			};
		} catch (error) {
			// If SQL parsing fails, use regex-based extraction
			return this.fallbackSQLAnalysis(sqlCode);
		}
	}

	/**
	 * Extract table names from SQL AST
	 */
	private extractTablesFromAST(ast: any, tables: string[]): void {
		if (!ast || typeof ast !== 'object') return;

		if (Array.isArray(ast)) {
			ast.forEach(item => this.extractTablesFromAST(item, tables));
			return;
		}

		// Handle different AST node types
		if (ast.table && typeof ast.table === 'string') {
			tables.push(ast.table);
		} else if (ast.table && ast.table.table) {
			tables.push(ast.table.table);
		}

		if (ast.from && Array.isArray(ast.from)) {
			ast.from.forEach((fromItem: any) => {
				if (fromItem.table) {
					tables.push(fromItem.table);
				}
			});
		}

		// Recursively search for more tables
		Object.values(ast).forEach(value => {
			if (typeof value === 'object') {
				this.extractTablesFromAST(value, tables);
			}
		});
	}

	/**
	 * Extract column names from SQL AST
	 */
	private extractColumnsFromAST(ast: any, columns: string[]): void {
		if (!ast || typeof ast !== 'object') return;

		if (Array.isArray(ast)) {
			ast.forEach(item => this.extractColumnsFromAST(item, columns));
			return;
		}

		if (ast.column && typeof ast.column === 'string') {
			columns.push(ast.column);
		}

		if (ast.columns && Array.isArray(ast.columns)) {
			ast.columns.forEach((col: any) => {
				if (typeof col === 'string') {
					columns.push(col);
				} else if (col.expr && col.expr.column) {
					columns.push(col.expr.column);
				}
			});
		}

		// Recursively search for more columns
		Object.values(ast).forEach(value => {
			if (typeof value === 'object') {
				this.extractColumnsFromAST(value, columns);
			}
		});
	}

	/**
	 * Fallback SQL analysis using regex when AST parsing fails
	 */
	private fallbackSQLAnalysis(sqlCode: string): SQLContext {
		const tables: string[] = [];
		const columns: string[] = [];
		const operations: string[] = [];

		// Extract table names using regex
		const tablePatterns = [
			/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/gi,
			/JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/gi,
			/INTO\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/gi
		];

		tablePatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(sqlCode)) !== null) {
				tables.push(match[1].split('.').pop() || match[1]);
			}
		});

		// Extract operations
		const operationPatterns = [
			/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/gim
		];

		operationPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(sqlCode)) !== null) {
				operations.push(match[1].toLowerCase());
			}
		});

		return {
			tables: [...new Set(tables)],
			columns: [...new Set(columns)],
			operations: [...new Set(operations)],
			dependencies: []
		};
	}

	/**
	 * Find symbol-based matches (simplified version of Void's symbol analysis)
	 */
	private async findSymbolMatches(searchTerms: string[], existingSnippets: CodeSnippet[]): Promise<CodeSnippet[]> {
		// For now, return empty array - in a full implementation, this would use tree-sitter
		// to analyze SQL and Python files for function/table definitions
		return [];
	}

	/**
	 * Rank results by relevance (enhanced from original)
	 */
	private rankByRelevance(results: CodeSnippet[], intent: string): CodeSnippet[] {
		const intentWords = intent.toLowerCase().split(/\s+/).filter(w => w.length > 2);

		return results.map(result => {
			let score = result.score;

			// Boost based on intent word matches in code
			intentWords.forEach(word => {
				if (result.code.toLowerCase().includes(word)) {
					score += 1.0;
				}
			});

			// Boost based on intent word matches in filename
			const fileName = path.basename(result.file).toLowerCase();
			intentWords.forEach(word => {
				if (fileName.includes(word)) {
					score += 0.5;
				}
			});

			// Boost SQL files for SQL-related intents
			if (result.file.endsWith('.sql') && intent.toLowerCase().includes('sql')) {
				score += 1.0;
			}

			// Boost DBT models for DBT-related intents
			if (result.file.includes('/models/') && intent.toLowerCase().includes('model')) {
				score += 1.0;
			}

			// Boost based on SQL context
			if (result.sqlContext) {
				intentWords.forEach(word => {
					if (result.sqlContext!.tables.some(table => table.toLowerCase().includes(word))) {
						score += 1.5;
					}
					if (result.sqlContext!.columns.some(col => col.toLowerCase().includes(word))) {
						score += 1.0;
					}
				});
			}

			return { ...result, score };
		}).sort((a, b) => b.score - a.score);
	}

	/**
	 * Remove duplicate snippets
	 */
	private deduplicateSnippets(snippets: CodeSnippet[]): CodeSnippet[] {
		const seen = new Set<string>();
		return snippets.filter(snippet => {
			const key = `${snippet.file}:${snippet.lineNumber}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	/**
	 * Remove duplicate file matches
	 */
	private deduplicateFileMatches(matches: Array<{ file: string; matchedTerm: string; score: number; lineNumber?: number }>): Array<{ file: string; matchedTerm: string; score: number; lineNumber?: number }> {
		const fileMap = new Map<string, { file: string; matchedTerm: string; score: number; lineNumber?: number }>();

		matches.forEach(match => {
			const existing = fileMap.get(match.file);
			if (!existing || match.score > existing.score) {
				fileMap.set(match.file, match);
			}
		});

		return Array.from(fileMap.values());
	}
}
