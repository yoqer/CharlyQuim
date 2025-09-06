/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../../platform/instantiation/common/extensions.js';
import { IVoidSettingsService } from '../voidSettingsService.js';

export interface SnowflakeConnectionParams {
	account: string;
	user: string;
	password: string;
	warehouse: string;
	database: string;
	schema: string;
	private_key_path?: string;
	passphrase?: string;
}

export interface SnowflakeStoredProcedure {
	procedure_name: string;
	procedure_definition: string;
	created: string;
	last_altered: string;
}

export interface SnowflakeView {
	table_name: string;
	view_definition: string;
	created: string;
	last_altered: string;
}

export interface SnowflakeTableColumn {
	name: string;
	type: string;
	nullable: boolean;
	default?: string;
	description?: string;
}

export interface SqlQuery {
	source: string;
	source_type: 'stored_procedure' | 'view';
	query: string;
	tables_referenced: string[];
	query_type: string;
	columns?: SnowflakeTableColumn[];
}

export interface ISnowflakeClient {
	readonly _serviceBrand: undefined;
	
	/**
	 * Test connection to Snowflake
	 */
	testConnection(params: SnowflakeConnectionParams): Promise<boolean>;
	
	/**
	 * Get all stored procedures from the schema
	 */
	getStoredProcedures(params: SnowflakeConnectionParams): Promise<SnowflakeStoredProcedure[]>;
	
	/**
	 * Get all views from the schema
	 */
	getViews(params: SnowflakeConnectionParams): Promise<SnowflakeView[]>;
	
	/**
	 * Get table schema information
	 */
	getTableSchema(params: SnowflakeConnectionParams, tableName: string): Promise<SnowflakeTableColumn[]>;
	
	/**
	 * Extract SQL queries from all procedures and views
	 */
	extractAllQueries(params: SnowflakeConnectionParams): Promise<SqlQuery[]>;
	
	/**
	 * Execute a query and return results
	 */
	executeQuery(params: SnowflakeConnectionParams, query: string): Promise<any[]>;
}

export const ISnowflakeClient = createDecorator<ISnowflakeClient>('snowflakeClient');

export class SnowflakeClient implements ISnowflakeClient {
	readonly _serviceBrand: undefined;

	constructor() {}

	async testConnection(params: SnowflakeConnectionParams): Promise<boolean> {
		try {
			// In a real implementation, this would use a Node.js backend service
			// For now, we'll simulate this
			const isValid = params.account && params.user && params.password && 
				params.warehouse && params.database && params.schema;
			return Boolean(isValid);
		} catch (error) {
			console.error('Snowflake connection test failed:', error);
			return false;
		}
	}

	async getStoredProcedures(params: SnowflakeConnectionParams): Promise<SnowflakeStoredProcedure[]> {
		// This would need to be implemented with a backend service that can execute Node.js
		// For now, return mock data for demo purposes
		return [
			{
				procedure_name: 'SAMPLE_PROCEDURE_1',
				procedure_definition: 'CREATE OR REPLACE PROCEDURE SAMPLE_PROCEDURE_1()\nBEGIN\n  SELECT * FROM SAMPLE_TABLE;\nEND;',
				created: '2024-01-01T00:00:00Z',
				last_altered: '2024-01-01T00:00:00Z'
			}
		];
	}

	async getViews(params: SnowflakeConnectionParams): Promise<SnowflakeView[]> {
		return [
			{
				table_name: 'SAMPLE_VIEW_1',
				view_definition: 'SELECT col1, col2, col3 FROM base_table WHERE active = 1',
				created: '2024-01-01T00:00:00Z',
				last_altered: '2024-01-01T00:00:00Z'
			}
		];
	}

	async getTableSchema(params: SnowflakeConnectionParams, tableName: string): Promise<SnowflakeTableColumn[]> {
		return [
			{
				name: 'ID',
				type: 'NUMBER',
				nullable: false,
				description: 'Primary key'
			},
			{
				name: 'NAME',
				type: 'VARCHAR',
				nullable: true,
				description: 'Name field'
			}
		];
	}

	async extractAllQueries(params: SnowflakeConnectionParams): Promise<SqlQuery[]> {
		const procedures = await this.getStoredProcedures(params);
		const views = await this.getViews(params);
		
		const queries: SqlQuery[] = [];
		
		// Extract from procedures
		for (const proc of procedures) {
			queries.push({
				source: `procedure_${proc.procedure_name}`,
				source_type: 'stored_procedure',
				query: proc.procedure_definition,
				tables_referenced: this.extractTableReferences(proc.procedure_definition),
				query_type: this.identifyQueryType(proc.procedure_definition)
			});
		}
		
		// Extract from views
		for (const view of views) {
			const columns = await this.getTableSchema(params, view.table_name);
			queries.push({
				source: `view_${view.table_name}`,
				source_type: 'view',
				query: view.view_definition,
				tables_referenced: this.extractTableReferences(view.view_definition),
				query_type: 'SELECT',
				columns
			});
		}
		
		return queries;
	}

	async executeQuery(params: SnowflakeConnectionParams, query: string): Promise<any[]> {
		// Mock implementation - would need backend service
		return [];
	}

	private extractTableReferences(sql: string): string[] {
		// Simple regex to extract table names - would need more sophisticated parsing in real implementation
		const tableRegex = /FROM\s+(\w+)/gi;
		const matches = [];
		let match;
		while ((match = tableRegex.exec(sql)) !== null) {
			matches.push(match[1]);
		}
		return matches;
	}

	private identifyQueryType(sql: string): string {
		const upperSql = sql.trim().toUpperCase();
		if (upperSql.startsWith('SELECT')) return 'SELECT';
		if (upperSql.startsWith('INSERT')) return 'INSERT';
		if (upperSql.startsWith('UPDATE')) return 'UPDATE';
		if (upperSql.startsWith('DELETE')) return 'DELETE';
		if (upperSql.startsWith('CREATE')) return 'CREATE';
		if (upperSql.startsWith('ALTER')) return 'ALTER';
		if (upperSql.startsWith('DROP')) return 'DROP';
		return 'UNKNOWN';
	}
}

registerSingleton(ISnowflakeClient, SnowflakeClient, InstantiationType.Delayed);