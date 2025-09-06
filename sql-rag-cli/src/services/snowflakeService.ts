/**
 * Enhanced Snowflake Service
 * Provides schema-aware Snowflake integration with intelligent SQL execution
 */

import snowflake from 'snowflake-sdk';
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

export class SnowflakeService {
	private config: SnowflakeConfig;
	private connection: any = null;
	private schemaCache: SnowflakeSchema | null = null;

	constructor(config: SnowflakeConfig) {
		this.config = config;
	}

	/**
	 * Test Snowflake connection
	 */
	async testConnection(): Promise<boolean> {
		console.log('❄️ Testing Snowflake connection...');

		try {
			await this.connect();
			await this.disconnect();
			console.log('✅ Snowflake connection successful');
			return true;
		} catch (error) {
			console.error('❌ Snowflake connection failed:', error);
			return false;
		}
	}

	/**
	 * Get schema information with caching
	 */
	async getSchema(forceRefresh: boolean = false): Promise<SnowflakeSchema> {
		if (this.schemaCache && !forceRefresh) {
			return this.schemaCache;
		}

		console.log('📊 Fetching Snowflake schema information...');

		try {
			await this.connect();

			const tables = await this.getTables();
			const tablesWithColumns = await Promise.all(
				tables.map(async (table) => ({
					...table,
					columns: await this.getTableColumns(table.name)
				}))
			);

			this.schemaCache = {
				database: this.config.database,
				schema: this.config.schema,
				tables: tablesWithColumns
			};

			console.log(`✅ Cached schema with ${tablesWithColumns.length} tables`);
			return this.schemaCache;
		} catch (error) {
			throw new Error(`Failed to get schema: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Execute SQL query with result formatting
	 */
	async executeQuery(sql: string, options: {
		dryRun?: boolean;
		timeout?: number;
		maxRows?: number;
	} = {}): Promise<{
		results: any[];
		rowCount: number;
		executionTime: number;
		warnings?: string[];
	}> {
		const startTime = Date.now();
		console.log(`🔍 Executing SQL${options.dryRun ? ' (DRY RUN)' : ''}:`);
		console.log(sql);

		try {
			await this.connect();

			if (options.dryRun) {
				// For dry run, just validate the SQL
				const explainSql = `EXPLAIN ${sql}`;
				const explainResult = await this.executeSnowflakeQuery(explainSql, options.timeout);

				return {
					results: explainResult,
					rowCount: 0,
					executionTime: Date.now() - startTime,
					warnings: ['This was a dry run - no data was modified']
				};
			}

			const results = await this.executeSnowflakeQuery(sql, options.timeout);
			const limitedResults = options.maxRows ? results.slice(0, options.maxRows) : results;

			const executionTime = Date.now() - startTime;
			console.log(`✅ Query executed in ${executionTime}ms, returned ${results.length} rows`);

			return {
				results: limitedResults,
				rowCount: results.length,
				executionTime,
				warnings: options.maxRows && results.length > options.maxRows
					? [`Results limited to ${options.maxRows} rows`]
					: undefined
			};
		} catch (error) {
			throw new Error(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Apply SQL edits with validation
	 */
	async applyEdits(edits: SQLEdit[], options: {
		dryRun?: boolean;
		validateFirst?: boolean;
	} = {}): Promise<{
		appliedEdits: SQLEdit[];
		failedEdits: { edit: SQLEdit; error: string }[];
		totalExecutionTime: number;
	}> {
		const startTime = Date.now();
		console.log(`🚀 Applying ${edits.length} SQL edits${options.dryRun ? ' (DRY RUN)' : ''}...`);

		const appliedEdits: SQLEdit[] = [];
		const failedEdits: { edit: SQLEdit; error: string }[] = [];

		try {
			await this.connect();

			for (const edit of edits) {
				try {
					// Validate SQL if requested
					if (options.validateFirst) {
						await this.validateSQL(edit.newCode);
					}

					// Execute the SQL
					await this.executeQuery(edit.newCode, {
						dryRun: options.dryRun,
						timeout: 30000 // 30 seconds per edit
					});

					appliedEdits.push(edit);
					console.log(`✅ Applied edit to ${edit.file}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					failedEdits.push({ edit, error: errorMessage });
					console.error(`❌ Failed to apply edit to ${edit.file}: ${errorMessage}`);
				}
			}

			const totalExecutionTime = Date.now() - startTime;
			console.log(`🎯 Applied ${appliedEdits.length}/${edits.length} edits in ${totalExecutionTime}ms`);

			return {
				appliedEdits,
				failedEdits,
				totalExecutionTime
			};
		} catch (error) {
			throw new Error(`Failed to apply edits: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Validate SQL syntax
	 */
	async validateSQL(sql: string): Promise<{ valid: boolean; errors?: string[] }> {
		try {
			await this.connect();

			// Use EXPLAIN to validate without executing
			const explainSql = `EXPLAIN ${sql}`;
			await this.executeSnowflakeQuery(explainSql, 10000); // 10 second timeout

			return { valid: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return {
				valid: false,
				errors: [errorMessage]
			};
		}
	}

	/**
	 * Get table suggestions based on query context
	 */
	async getTableSuggestions(query: string): Promise<{
		tables: SnowflakeTable[];
		columns: SnowflakeColumn[];
	}> {
		const schema = await this.getSchema();
		const queryLower = query.toLowerCase();

		// Find tables mentioned in the query
		const mentionedTables = schema.tables.filter(table =>
			queryLower.includes(table.name.toLowerCase())
		);

		// Find columns mentioned in the query
		const mentionedColumns: SnowflakeColumn[] = [];
		schema.tables.forEach(table => {
			table.columns.forEach(column => {
				if (queryLower.includes(column.name.toLowerCase())) {
					mentionedColumns.push(column);
				}
			});
		});

		return {
			tables: mentionedTables,
			columns: mentionedColumns
		};
	}

	/**
	 * Analyze query performance
	 */
	async analyzeQueryPerformance(sql: string): Promise<{
		estimatedCost: number;
		warnings: string[];
		suggestions: string[];
	}> {
		try {
			await this.connect();

			// Get query profile
			const profileSql = `EXPLAIN USING JSON ${sql}`;
			const profileResult = await this.executeSnowflakeQuery(profileSql, 30000);

			const warnings: string[] = [];
			const suggestions: string[] = [];
			let estimatedCost = 0;

			// Basic analysis (would be more sophisticated in production)
			if (sql.toLowerCase().includes('select *')) {
				warnings.push('Query uses SELECT *, which may impact performance');
				suggestions.push('Consider selecting only necessary columns');
			}

			if (sql.toLowerCase().includes('order by') && !sql.toLowerCase().includes('limit')) {
				warnings.push('ORDER BY without LIMIT may be expensive on large datasets');
				suggestions.push('Consider adding LIMIT clause if full result set is not needed');
			}

			if (!sql.toLowerCase().includes('where')) {
				warnings.push('Query has no WHERE clause - may scan entire table');
				suggestions.push('Add WHERE clause to filter data');
			}

			// Estimate cost based on query complexity
			const joinCount = (sql.toLowerCase().match(/join/g) || []).length;
			const tableCount = (sql.toLowerCase().match(/from|join/g) || []).length;
			estimatedCost = Math.min(joinCount * 10 + tableCount * 5, 100);

			return {
				estimatedCost,
				warnings,
				suggestions
			};
		} catch (error) {
			console.warn('Query analysis failed:', error);
			return {
				estimatedCost: 50, // Default estimate
				warnings: ['Could not analyze query performance'],
				suggestions: []
			};
		}
	}

	/**
	 * Connect to Snowflake
	 */
	private async connect(): Promise<void> {
		if (this.connection) {
			return; // Already connected
		}

		return new Promise((resolve, reject) => {
			this.connection = snowflake.createConnection({
				account: this.config.account,
				username: this.config.user,
				password: this.config.password,
				warehouse: this.config.warehouse,
				database: this.config.database,
				schema: this.config.schema,
				...(this.config.private_key_path && {
					privateKeyPath: this.config.private_key_path,
					privateKeyPass: this.config.passphrase
				})
			});

			this.connection.connect((err: any, conn: any) => {
				if (err) {
					reject(new Error(`Failed to connect to Snowflake: ${err.message}`));
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Disconnect from Snowflake
	 */
	async disconnect(): Promise<void> {
		if (this.connection) {
			return new Promise((resolve) => {
				this.connection.destroy((err: any) => {
					if (err) {
						console.warn('Warning during disconnect:', err);
					}
					this.connection = null;
					resolve();
				});
			});
		}
	}

	/**
	 * Execute Snowflake query with proper error handling
	 */
	private async executeSnowflakeQuery(sql: string, timeout: number = 60000): Promise<any[]> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(`Query timeout after ${timeout}ms`));
			}, timeout);

			this.connection.execute({
				sqlText: sql,
				complete: (err: any, stmt: any, rows: any[]) => {
					clearTimeout(timer);

					if (err) {
						reject(new Error(`SQL execution error: ${err.message}`));
					} else {
						resolve(rows || []);
					}
				}
			});
		});
	}

	/**
	 * Get all tables in the current schema
	 */
	private async getTables(): Promise<SnowflakeTable[]> {
		const sql = `
      SELECT
        table_name,
        table_type,
        created,
        last_altered
      FROM information_schema.tables
      WHERE table_schema = '${this.config.schema}'
      ORDER BY table_name
    `;

		const rows = await this.executeSnowflakeQuery(sql);

		return rows.map(row => ({
			name: row.TABLE_NAME,
			type: row.TABLE_TYPE === 'BASE TABLE' ? 'TABLE' : 'VIEW',
			columns: [], // Will be populated separately
			created: row.CREATED,
			lastAltered: row.LAST_ALTERED
		}));
	}

	/**
	 * Get columns for a specific table
	 */
	private async getTableColumns(tableName: string): Promise<SnowflakeColumn[]> {
		const sql = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        comment
      FROM information_schema.columns
      WHERE table_schema = '${this.config.schema}'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `;

		const rows = await this.executeSnowflakeQuery(sql);

		return rows.map(row => ({
			name: row.COLUMN_NAME,
			type: row.DATA_TYPE,
			nullable: row.IS_NULLABLE === 'YES',
			default: row.COLUMN_DEFAULT,
			description: row.COMMENT
		}));
	}

	/**
	 * Clean up resources
	 */
	async cleanup(): Promise<void> {
		await this.disconnect();
		this.schemaCache = null;
	}
}
