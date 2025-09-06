/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../../platform/instantiation/common/extensions.js';
import { ISnowflakeClient, SnowflakeConnectionParams, SqlQuery } from './snowflakeClient.js';
import { IVoidSettingsService } from '../voidSettingsService.js';
import { RawToolParamsObj } from '../sendLLMMessageTypes.js';

export type SnowflakeToolName = 
	| 'snowflake_list_procedures'
	| 'snowflake_list_views' 
	| 'snowflake_get_table_schema'
	| 'snowflake_extract_queries'
	| 'snowflake_test_connection'
	| 'snowflake_execute_query'
	| 'snowflake_analyze_sql';

export type SnowflakeToolCallParams = {
	snowflake_list_procedures: {};
	snowflake_list_views: {};
	snowflake_get_table_schema: { tableName: string };
	snowflake_extract_queries: {};
	snowflake_test_connection: {};
	snowflake_execute_query: { query: string };
	snowflake_analyze_sql: { sql: string };
}

export type SnowflakeToolResultType = {
	snowflake_list_procedures: { procedures: Array<{ name: string, definition: string, created: string, lastAltered: string }> };
	snowflake_list_views: { views: Array<{ name: string, definition: string, created: string, lastAltered: string }> };
	snowflake_get_table_schema: { columns: Array<{ name: string, type: string, nullable: boolean, description?: string }> };
	snowflake_extract_queries: { queries: SqlQuery[] };
	snowflake_test_connection: { success: boolean, message: string };
	snowflake_execute_query: { results: any[], rowCount: number };
	snowflake_analyze_sql: { 
		issues: Array<{ 
			type: 'error' | 'warning' | 'suggestion',
			message: string,
			line?: number,
			column?: number
		}>;
		suggestions: string[];
		complexity: 'low' | 'medium' | 'high';
	};
}

export interface ISnowflakeToolsService {
	readonly _serviceBrand: undefined;
	
	validateParams: {
		[T in SnowflakeToolName]: (params: RawToolParamsObj) => SnowflakeToolCallParams[T]
	};
	
	callTool: {
		[T in SnowflakeToolName]: (params: SnowflakeToolCallParams[T]) => Promise<{ result: SnowflakeToolResultType[T] }>
	};
	
	stringOfResult: {
		[T in SnowflakeToolName]: (params: SnowflakeToolCallParams[T], result: SnowflakeToolResultType[T]) => string
	};
}

export const ISnowflakeToolsService = createDecorator<ISnowflakeToolsService>('snowflakeToolsService');

export class SnowflakeToolsService implements ISnowflakeToolsService {
	readonly _serviceBrand: undefined;

	constructor(
		@ISnowflakeClient private readonly snowflakeClient: ISnowflakeClient,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService
	) {}

	validateParams = {
		snowflake_list_procedures: () => ({}),
		snowflake_list_views: () => ({}),
		snowflake_get_table_schema: (params: RawToolParamsObj) => {
			const tableName = params.table_name;
			if (typeof tableName !== 'string') {
				throw new Error('table_name must be a string');
			}
			return { tableName };
		},
		snowflake_extract_queries: () => ({}),
		snowflake_test_connection: () => ({}),
		snowflake_execute_query: (params: RawToolParamsObj) => {
			const query = params.query;
			if (typeof query !== 'string') {
				throw new Error('query must be a string');
			}
			return { query };
		},
		snowflake_analyze_sql: (params: RawToolParamsObj) => {
			const sql = params.sql;
			if (typeof sql !== 'string') {
				throw new Error('sql must be a string');
			}
			return { sql };
		}
	};

	callTool = {
		snowflake_list_procedures: async () => {
			const connectionParams = this.getConnectionParams();
			const procedures = await this.snowflakeClient.getStoredProcedures(connectionParams);
			return {
				result: {
					procedures: procedures.map(p => ({
						name: p.procedure_name,
						definition: p.procedure_definition,
						created: p.created,
						lastAltered: p.last_altered
					}))
				}
			};
		},

		snowflake_list_views: async () => {
			const connectionParams = this.getConnectionParams();
			const views = await this.snowflakeClient.getViews(connectionParams);
			return {
				result: {
					views: views.map(v => ({
						name: v.table_name,
						definition: v.view_definition,
						created: v.created,
						lastAltered: v.last_altered
					}))
				}
			};
		},

		snowflake_get_table_schema: async ({ tableName }) => {
			const connectionParams = this.getConnectionParams();
			const columns = await this.snowflakeClient.getTableSchema(connectionParams, tableName);
			return {
				result: {
					columns: columns.map(c => ({
						name: c.name,
						type: c.type,
						nullable: c.nullable,
						description: c.description
					}))
				}
			};
		},

		snowflake_extract_queries: async () => {
			const connectionParams = this.getConnectionParams();
			const queries = await this.snowflakeClient.extractAllQueries(connectionParams);
			return { result: { queries } };
		},

		snowflake_test_connection: async () => {
			try {
				const connectionParams = this.getConnectionParams();
				const success = await this.snowflakeClient.testConnection(connectionParams);
				return {
					result: {
						success,
						message: success ? 'Connection successful' : 'Connection failed'
					}
				};
			} catch (error) {
				return {
					result: {
						success: false,
						message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
					}
				};
			}
		},

		snowflake_execute_query: async ({ query }) => {
			const connectionParams = this.getConnectionParams();
			const results = await this.snowflakeClient.executeQuery(connectionParams, query);
			return {
				result: {
					results,
					rowCount: results.length
				}
			};
		},

		snowflake_analyze_sql: async ({ sql }) => {
			// Basic SQL analysis - in a real implementation, this would use a proper SQL parser
			const issues = this.analyzeSqlForIssues(sql);
			const suggestions = this.generateSqlSuggestions(sql);
			const complexity = this.assessSqlComplexity(sql);

			return {
				result: {
					issues: issues as Array<{ type: 'error' | 'warning' | 'suggestion', message: string, line?: number, column?: number }>,
					suggestions,
					complexity: complexity as 'low' | 'medium' | 'high'
				}
			};
		}
	};

	stringOfResult = {
		snowflake_list_procedures: (params: SnowflakeToolCallParams['snowflake_list_procedures'], result: SnowflakeToolResultType['snowflake_list_procedures']) => {
			if (result.procedures.length === 0) {
				return 'No stored procedures found in the schema.';
			}
			return `Found ${result.procedures.length} stored procedures:\n\n${result.procedures.map(p => 
				`**${p.name}**\n- Created: ${p.created}\n- Last altered: ${p.lastAltered}`
			).join('\n\n')}`;
		},

		snowflake_list_views: (params: SnowflakeToolCallParams['snowflake_list_views'], result: SnowflakeToolResultType['snowflake_list_views']) => {
			if (result.views.length === 0) {
				return 'No views found in the schema.';
			}
			return `Found ${result.views.length} views:\n\n${result.views.map(v => 
				`**${v.name}**\n- Created: ${v.created}\n- Last altered: ${v.lastAltered}`
			).join('\n\n')}`;
		},

		snowflake_get_table_schema: (params: SnowflakeToolCallParams['snowflake_get_table_schema'], result: SnowflakeToolResultType['snowflake_get_table_schema']) => {
			return `Schema for table ${params.tableName}:\n\n${result.columns.map(c => 
				`- **${c.name}** (${c.type})${c.nullable ? ' - nullable' : ' - not null'}${c.description ? ` - ${c.description}` : ''}`
			).join('\n')}`;
		},

		snowflake_extract_queries: (params: SnowflakeToolCallParams['snowflake_extract_queries'], result: SnowflakeToolResultType['snowflake_extract_queries']) => {
			if (result.queries.length === 0) {
				return 'No SQL queries found to extract.';
			}
			return `Extracted ${result.queries.length} SQL queries:\n\n${result.queries.map((q, i: number) => 
				`**Query ${i + 1}** (${q.source_type}: ${q.source})\nType: ${q.query_type}\nTables referenced: ${q.tables_referenced.join(', ')}\n\`\`\`sql\n${q.query}\n\`\`\``
			).join('\n\n')}`;
		},

		snowflake_test_connection: (params: SnowflakeToolCallParams['snowflake_test_connection'], result: SnowflakeToolResultType['snowflake_test_connection']) => {
			return result.success ? '✅ Snowflake connection successful!' : `❌ ${result.message}`;
		},

		snowflake_execute_query: (params: SnowflakeToolCallParams['snowflake_execute_query'], result: SnowflakeToolResultType['snowflake_execute_query']) => {
			return `Query executed successfully. Returned ${result.rowCount} rows.\n\n\`\`\`sql\n${params.query}\n\`\`\`\n\nResults: ${JSON.stringify(result.results.slice(0, 5), null, 2)}${result.results.length > 5 ? '\n...(showing first 5 rows)' : ''}`;
		},

		snowflake_analyze_sql: (params: SnowflakeToolCallParams['snowflake_analyze_sql'], result: SnowflakeToolResultType['snowflake_analyze_sql']) => {
			const issuesByType = {
				error: result.issues.filter((i: any) => i.type === 'error'),
				warning: result.issues.filter((i: any) => i.type === 'warning'),
				suggestion: result.issues.filter((i: any) => i.type === 'suggestion')
			};

			let output = `SQL Analysis Results (Complexity: ${result.complexity})\n\n`;

			if (issuesByType.error.length > 0) {
				output += `**Errors (${issuesByType.error.length}):**\n${issuesByType.error.map((i: any) => `- ${i.message}${i.line ? ` (line ${i.line})` : ''}`).join('\n')}\n\n`;
			}

			if (issuesByType.warning.length > 0) {
				output += `**Warnings (${issuesByType.warning.length}):**\n${issuesByType.warning.map((i: any) => `- ${i.message}${i.line ? ` (line ${i.line})` : ''}`).join('\n')}\n\n`;
			}

			if (issuesByType.suggestion.length > 0) {
				output += `**Suggestions (${issuesByType.suggestion.length}):**\n${issuesByType.suggestion.map((i: any) => `- ${i.message}${i.line ? ` (line ${i.line})` : ''}`).join('\n')}\n\n`;
			}

			if (result.suggestions.length > 0) {
				output += `**Recommendations:**\n${result.suggestions.map((s: string) => `- ${s}`).join('\n')}\n\n`;
			}

			if (result.issues.length === 0) {
				output += '✅ No issues found in the SQL code.\n\n';
			}

			return output;
		}
	};

	private getConnectionParams(): SnowflakeConnectionParams {
		const settings = this.voidSettingsService.state.globalSettings.snowflakeSettings;
		if (!settings.account || !settings.user || !settings.password || !settings.warehouse || !settings.database || !settings.schema) {
			throw new Error('Snowflake connection settings are incomplete. Please configure them in settings.');
		}
		return settings;
	}

	private analyzeSqlForIssues(sql: string): Array<{ type: 'error' | 'warning' | 'suggestion', message: string, line?: number, column?: number }> {
		const issues = [];
		const lines = sql.split('\n');

		// Basic SQL analysis
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim().toLowerCase();
			const lineNum = i + 1;

			// Check for common issues
			if (line.includes('select *')) {
				issues.push({
					type: 'suggestion' as const,
					message: 'Consider selecting specific columns instead of using SELECT *',
					line: lineNum
				});
			}

			if (line.includes('where') && !line.includes('=') && !line.includes('like') && !line.includes('in')) {
				issues.push({
					type: 'warning' as const,
					message: 'WHERE clause might be missing conditions',
					line: lineNum
				});
			}

			if (line.includes('union') && !line.includes('union all')) {
				issues.push({
					type: 'suggestion' as const,
					message: 'Consider using UNION ALL instead of UNION if duplicates are not a concern',
					line: lineNum
				});
			}
		}

		return issues;
	}

	private generateSqlSuggestions(sql: string): string[] {
		const suggestions = [];

		if (sql.toLowerCase().includes('join')) {
			suggestions.push('Consider adding appropriate indexes for JOIN operations');
		}

		if (sql.toLowerCase().includes('group by')) {
			suggestions.push('Ensure GROUP BY columns are indexed for better performance');
		}

		if (sql.toLowerCase().includes('order by')) {
			suggestions.push('ORDER BY operations can be expensive on large datasets');
		}

		if (sql.split('\n').length > 50) {
			suggestions.push('Consider breaking down complex queries into smaller, manageable parts');
		}

		return suggestions;
	}

	private assessSqlComplexity(sql: string): 'low' | 'medium' | 'high' {
		const lines = sql.split('\n').length;
		const joinCount = (sql.toLowerCase().match(/join/g) || []).length;
		const subqueryCount = (sql.toLowerCase().match(/\(/g) || []).length;

		if (lines > 100 || joinCount > 5 || subqueryCount > 3) {
			return 'high';
		} else if (lines > 20 || joinCount > 2 || subqueryCount > 1) {
			return 'medium';
		} else {
			return 'low';
		}
	}
}

registerSingleton(ISnowflakeToolsService, SnowflakeToolsService, InstantiationType.Delayed);