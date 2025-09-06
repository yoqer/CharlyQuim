/**
 * DBT Integration Service
 * Handles DBT project discovery, model parsing, and dependency analysis
 */
import { DBTModel } from '../types/index.js';
export declare class DBTService {
    private projectPath;
    private profilesDir?;
    private target?;
    private modelsCache;
    constructor(projectPath: string, options?: {
        profilesDir?: string;
        target?: string;
    });
    /**
     * Discover and parse DBT project
     */
    discoverProject(): Promise<{
        models: DBTModel[];
        projectConfig: any;
        manifest?: any;
    }>;
    /**
     * Find models related to search terms
     */
    findRelatedModels(searchTerms: string[]): Promise<DBTModel[]>;
    /**
     * Get model dependencies
     */
    getModelDependencies(modelName: string): string[];
    /**
     * Run DBT commands
     */
    runDBTCommand(command: string, options?: {
        select?: string;
        exclude?: string;
        dryRun?: boolean;
    }): Promise<string>;
    /**
     * Validate DBT project structure
     */
    private validateProject;
    /**
     * Parse dbt_project.yml
     */
    private parseProjectConfig;
    /**
     * Discover all models in the project
     */
    private discoverModels;
    /**
     * Parse individual model file
     */
    private parseModel;
    /**
     * Extract model dependencies from SQL content
     */
    private extractDependencies;
    /**
     * Parse schema.yml files for model metadata
     */
    private parseSchemaFile;
    /**
     * Parse DBT manifest file
     */
    private parseManifest;
    /**
     * Generate DBT manifest
     */
    private generateManifest;
    /**
     * Enhance models with manifest data
     */
    private enhanceModelsWithManifest;
    /**
     * Update model with new annotations
     */
    annotateModel(modelName: string, annotations: {
        description?: string;
        columns?: {
            name: string;
            description: string;
        }[];
    }): Promise<void>;
}
//# sourceMappingURL=dbtService.d.ts.map