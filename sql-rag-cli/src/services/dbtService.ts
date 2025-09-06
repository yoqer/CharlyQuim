/**
 * DBT Integration Service
 * Handles DBT project discovery, model parsing, and dependency analysis
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';
import YAML from 'yaml';
import { DBTModel, DBTColumn } from '../types/index.js';

export class DBTService {
	private projectPath: string;
	private profilesDir?: string;
	private target?: string;
	private modelsCache: Map<string, DBTModel> = new Map();

	constructor(projectPath: string, options: {
		profilesDir?: string;
		target?: string;
	} = {}) {
		this.projectPath = path.resolve(projectPath);
		this.profilesDir = options.profilesDir;
		this.target = options.target;
	}

	/**
	 * Discover and parse DBT project
	 */
	async discoverProject(): Promise<{
		models: DBTModel[];
		projectConfig: any;
		manifest?: any;
	}> {
		console.log(`🔍 Discovering DBT project at: ${this.projectPath}`);

		try {
			// Validate DBT project
			await this.validateProject();

			// Parse project configuration
			const projectConfig = await this.parseProjectConfig();

			// Discover models
			const models = await this.discoverModels();

			// Try to parse manifest if available
			let manifest;
			try {
				manifest = await this.parseManifest();
			} catch (error) {
				console.warn('⚠️ Manifest not found or invalid, trying to generate...');
				try {
					await this.generateManifest();
					manifest = await this.parseManifest();
				} catch (manifestError) {
					console.warn('⚠️ Could not generate manifest (DBT may not be installed). Continuing without manifest...');
					manifest = null;
				}
			}

			// Enhance models with manifest data
			if (manifest) {
				this.enhanceModelsWithManifest(models, manifest);
			}

			console.log(`✅ Discovered ${models.length} DBT models`);
			return { models, projectConfig, manifest };
		} catch (error) {
			throw new Error(`Failed to discover DBT project: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Find models related to search terms
	 */
	async findRelatedModels(searchTerms: string[]): Promise<DBTModel[]> {
		const allModels = Array.from(this.modelsCache.values());
		const relatedModels: DBTModel[] = [];

		for (const model of allModels) {
			let relevanceScore = 0;

			// Check model name
			searchTerms.forEach(term => {
				if (model.name.toLowerCase().includes(term.toLowerCase())) {
					relevanceScore += 2;
				}
			});

			// Check model path
			searchTerms.forEach(term => {
				if (model.path.toLowerCase().includes(term.toLowerCase())) {
					relevanceScore += 1;
				}
			});

			// Check model description
			if (model.description) {
				searchTerms.forEach(term => {
					if (model.description!.toLowerCase().includes(term.toLowerCase())) {
						relevanceScore += 1;
					}
				});
			}

			// Check column names and descriptions
			if (model.columns) {
				model.columns.forEach(column => {
					searchTerms.forEach(term => {
						if (column.name.toLowerCase().includes(term.toLowerCase())) {
							relevanceScore += 1;
						}
						if (column.description && column.description.toLowerCase().includes(term.toLowerCase())) {
							relevanceScore += 0.5;
						}
					});
				});
			}

			if (relevanceScore > 0) {
				relatedModels.push({ ...model, score: relevanceScore } as DBTModel & { score: number });
			}
		}

		return relatedModels
			.sort((a, b) => ((b as any).score || 0) - ((a as any).score || 0))
			.slice(0, 20);
	}

	/**
	 * Get model dependencies
	 */
	getModelDependencies(modelName: string): string[] {
		const model = this.modelsCache.get(modelName);
		return model ? model.dependencies : [];
	}

	/**
	 * Run DBT commands
	 */
	async runDBTCommand(command: string, options: {
		select?: string;
		exclude?: string;
		dryRun?: boolean;
	} = {}): Promise<string> {
		let dbtCommand = `dbt ${command}`;

		if (options.select) {
			dbtCommand += ` --select ${options.select}`;
		}

		if (options.exclude) {
			dbtCommand += ` --exclude ${options.exclude}`;
		}

		if (options.dryRun) {
			dbtCommand += ' --dry-run';
		}

		if (this.profilesDir) {
			dbtCommand += ` --profiles-dir ${this.profilesDir}`;
		}

		if (this.target) {
			dbtCommand += ` --target ${this.target}`;
		}

		console.log(`🚀 Running: ${dbtCommand}`);

		try {
			const output = execSync(dbtCommand, {
				cwd: this.projectPath,
				encoding: 'utf8',
				timeout: 300000 // 5 minutes
			});

			return output;
		} catch (error) {
			throw new Error(`DBT command failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Validate DBT project structure
	 */
	private async validateProject(): Promise<void> {
		const dbtProjectFile = path.join(this.projectPath, 'dbt_project.yml');

		if (!await fs.pathExists(dbtProjectFile)) {
			throw new Error(`dbt_project.yml not found at ${dbtProjectFile}`);
		}

		const modelsDir = path.join(this.projectPath, 'models');
		if (!await fs.pathExists(modelsDir)) {
			throw new Error(`models directory not found at ${modelsDir}`);
		}
	}

	/**
	 * Parse dbt_project.yml
	 */
	private async parseProjectConfig(): Promise<any> {
		const configPath = path.join(this.projectPath, 'dbt_project.yml');
		const configContent = await fs.readFile(configPath, 'utf8');
		return YAML.parse(configContent);
	}

	/**
	 * Discover all models in the project
	 */
	private async discoverModels(): Promise<DBTModel[]> {
		const models: DBTModel[] = [];

		// Find all SQL files in models directory
		const modelFiles = await glob('**/*.sql', {
			cwd: path.join(this.projectPath, 'models'),
			absolute: true
		});

		for (const modelFile of modelFiles) {
			try {
				const model = await this.parseModel(modelFile);
				models.push(model);
				this.modelsCache.set(model.name, model);
			} catch (error) {
				console.warn(`⚠️ Failed to parse model ${modelFile}:`, error);
			}
		}

		// Find schema.yml files for additional model metadata
		const schemaFiles = await glob('**/schema.yml', {
			cwd: path.join(this.projectPath, 'models'),
			absolute: true
		});

		const schemaFiles2 = await glob('**/_schema.yml', {
			cwd: path.join(this.projectPath, 'models'),
			absolute: true
		});

		for (const schemaFile of [...schemaFiles, ...schemaFiles2]) {
			try {
				await this.parseSchemaFile(schemaFile, models);
			} catch (error) {
				console.warn(`⚠️ Failed to parse schema file ${schemaFile}:`, error);
			}
		}

		return models;
	}

	/**
	 * Parse individual model file
	 */
	private async parseModel(modelFile: string): Promise<DBTModel> {
		const content = await fs.readFile(modelFile, 'utf8');
		const relativePath = path.relative(this.projectPath, modelFile);
		const modelName = path.basename(modelFile, '.sql');

		// Extract config block from the model
		const configMatch = content.match(/\{\{\s*config\(([\s\S]*?)\)\s*\}\}/);
		let modelType: 'model' | 'source' | 'snapshot' | 'test' = 'model';

		if (relativePath.includes('/snapshots/')) {
			modelType = 'snapshot';
		} else if (relativePath.includes('/tests/')) {
			modelType = 'test';
		}

		// Extract dependencies using ref() and source() functions
		const dependencies = this.extractDependencies(content);

		return {
			name: modelName,
			path: relativePath,
			type: modelType,
			dependencies,
			columns: [],
			description: undefined
		};
	}

	/**
	 * Extract model dependencies from SQL content
	 */
	private extractDependencies(sqlContent: string): string[] {
		const dependencies: string[] = [];

		// Extract ref() calls
		const refPattern = /\{\{\s*ref\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\}\}/g;
		let match;
		while ((match = refPattern.exec(sqlContent)) !== null) {
			dependencies.push(match[1]);
		}

		// Extract source() calls
		const sourcePattern = /\{\{\s*source\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)\s*\}\}/g;
		while ((match = sourcePattern.exec(sqlContent)) !== null) {
			dependencies.push(`${match[1]}.${match[2]}`);
		}

		return [...new Set(dependencies)];
	}

	/**
	 * Parse schema.yml files for model metadata
	 */
	private async parseSchemaFile(schemaFile: string, models: DBTModel[]): Promise<void> {
		const content = await fs.readFile(schemaFile, 'utf8');
		const schema = YAML.parse(content);

		if (!schema.models) return;

		for (const modelSchema of schema.models) {
			const modelName = modelSchema.name;
			const model = models.find(m => m.name === modelName);

			if (model) {
				// Add description
				if (modelSchema.description) {
					model.description = modelSchema.description;
				}

				// Add columns
				if (modelSchema.columns) {
					model.columns = modelSchema.columns.map((col: any) => ({
						name: col.name,
						type: col.data_type,
						description: col.description,
						tests: col.tests ? col.tests.map((test: any) =>
							typeof test === 'string' ? test : test.test || Object.keys(test)[0]
						) : []
					}));
				}
			}
		}
	}

	/**
	 * Parse DBT manifest file
	 */
	private async parseManifest(): Promise<any> {
		const manifestPath = path.join(this.projectPath, 'target', 'manifest.json');

		if (!await fs.pathExists(manifestPath)) {
			throw new Error('Manifest file not found');
		}

		const manifestContent = await fs.readFile(manifestPath, 'utf8');
		return JSON.parse(manifestContent);
	}

	/**
	 * Generate DBT manifest
	 */
	private async generateManifest(): Promise<void> {
		console.log('📝 Generating DBT manifest...');
		await this.runDBTCommand('parse');
	}

	/**
	 * Enhance models with manifest data
	 */
	private enhanceModelsWithManifest(models: DBTModel[], manifest: any): void {
		if (!manifest.nodes) return;

		for (const model of models) {
			// Find corresponding node in manifest
			const nodeKey = Object.keys(manifest.nodes).find(key =>
				key.includes(model.name) && manifest.nodes[key].resource_type === 'model'
			);

			if (nodeKey) {
				const node = manifest.nodes[nodeKey];

				// Update dependencies
				if (node.depends_on && node.depends_on.nodes) {
					model.dependencies = node.depends_on.nodes.map((dep: string) => {
						const depNode = manifest.nodes[dep];
						return depNode ? depNode.name : dep;
					});
				}

				// Add columns if not already present
				if (node.columns && !model.columns?.length) {
					model.columns = Object.values(node.columns).map((col: any) => ({
						name: col.name,
						type: col.data_type,
						description: col.description
					}));
				}
			}
		}
	}

	/**
	 * Update model with new annotations
	 */
	async annotateModel(modelName: string, annotations: {
		description?: string;
		columns?: { name: string; description: string }[];
	}): Promise<void> {
		console.log(`📝 Annotating model: ${modelName}`);

		// Find the model's schema file or create one
		const model = this.modelsCache.get(modelName);
		if (!model) {
			throw new Error(`Model ${modelName} not found`);
		}

		const modelDir = path.dirname(path.join(this.projectPath, model.path));
		const schemaFile = path.join(modelDir, 'schema.yml');

		let schema: any = { version: 2, models: [] };

		// Read existing schema file if it exists
		if (await fs.pathExists(schemaFile)) {
			const content = await fs.readFile(schemaFile, 'utf8');
			schema = YAML.parse(content) || schema;
		}

		// Find or create model entry
		let modelEntry = schema.models.find((m: any) => m.name === modelName);
		if (!modelEntry) {
			modelEntry = { name: modelName };
			schema.models.push(modelEntry);
		}

		// Update annotations
		if (annotations.description) {
			modelEntry.description = annotations.description;
		}

		if (annotations.columns) {
			if (!modelEntry.columns) {
				modelEntry.columns = [];
			}

			annotations.columns.forEach(newCol => {
				let existingCol = modelEntry.columns.find((c: any) => c.name === newCol.name);
				if (!existingCol) {
					existingCol = { name: newCol.name };
					modelEntry.columns.push(existingCol);
				}
				existingCol.description = newCol.description;
			});
		}

		// Write back to file
		const yamlContent = YAML.stringify(schema, {
			indent: 2,
			lineWidth: 80,
			minContentWidth: 20
		});

		await fs.writeFile(schemaFile, yamlContent, 'utf8');
		console.log(`✅ Updated schema file: ${schemaFile}`);
	}
}
