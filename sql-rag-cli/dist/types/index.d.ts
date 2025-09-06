export interface IRange {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}
export interface Position {
    lineNumber: number;
    column: number;
}
export interface DocumentSymbol {
    name: string;
    detail: string;
    kind: SymbolKind;
    range: IRange;
    selectionRange: IRange;
    children: DocumentSymbol[];
    tags?: any[];
}
export declare enum SymbolKind {
    File = 0,
    Module = 1,
    Namespace = 2,
    Package = 3,
    Class = 4,
    Method = 5,
    Property = 6,
    Field = 7,
    Constructor = 8,
    Enum = 9,
    Interface = 10,
    Function = 11,
    Variable = 12,
    Constant = 13,
    String = 14,
    Number = 15,
    Boolean = 16,
    Array = 17,
    Object = 18,
    Key = 19,
    Null = 20,
    EnumMember = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25
}
export interface CodeSnippet {
    file: string;
    lineNumber: number;
    matchedTerm: string;
    code: string;
    score: number;
    symbols?: DocumentSymbol[];
    sqlContext?: SQLContext;
}
export interface SQLContext {
    tables: string[];
    columns: string[];
    operations: string[];
    dependencies: string[];
}
export interface DBTModel {
    name: string;
    path: string;
    type: 'model' | 'source' | 'snapshot' | 'test';
    dependencies: string[];
    columns?: DBTColumn[];
    description?: string;
}
export interface DBTColumn {
    name: string;
    type?: string;
    description?: string;
    tests?: string[];
}
export interface SnowflakeSchema {
    database: string;
    schema: string;
    tables: SnowflakeTable[];
}
export interface SnowflakeTable {
    name: string;
    type: 'TABLE' | 'VIEW';
    columns: SnowflakeColumn[];
    created: string;
    lastAltered?: string;
}
export interface SnowflakeColumn {
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    description?: string;
}
export interface SQLEdit {
    file: string;
    originalCode: string;
    newCode: string;
    lineStart: number;
    lineEnd: number;
    reason: string;
}
export interface RAGSearchResult {
    snippets: CodeSnippet[];
    totalScore: number;
    searchTerms: string[];
    executionTime: number;
}
export interface LLMConfig {
    provider: 'openai' | 'anthropic';
    model: string;
    apiKey: string;
    temperature?: number;
    maxTokens?: number;
}
export interface CLIConfig {
    llm: LLMConfig;
    snowflake: {
        account: string;
        user: string;
        password: string;
        warehouse: string;
        database: string;
        schema: string;
    };
    dbt: {
        projectPath: string;
        profilesDir?: string;
        target?: string;
    };
    search: {
        maxSnippetLines: number;
        numContextLines: number;
        extensions: string[];
    };
}
//# sourceMappingURL=index.d.ts.map