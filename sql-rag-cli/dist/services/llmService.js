/**
 * LLM Service for Intelligent Code Generation
 * Provides AI-powered SQL code generation and modification
 */
import OpenAI from 'openai';
export class LLMService {
    openai;
    config;
    constructor(config) {
        this.config = config;
        this.openai = new OpenAI({
            apiKey: config.apiKey
        });
    }
    /**
     * Generate SQL edits based on user intent and context
     */
    async generateSQLEdits(intent, ragResults, schema, dbtModels) {
        console.log('🤖 Generating SQL edits using LLM...');
        try {
            const prompt = this.buildEditPrompt(intent, ragResults, schema, dbtModels);
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature || 0.1,
                max_tokens: this.config.maxTokens || 4000
            });
            const responseContent = response.choices[0]?.message?.content;
            if (!responseContent) {
                throw new Error('No response from LLM');
            }
            const edits = this.parseEditResponse(responseContent, ragResults.snippets);
            console.log(`✅ Generated ${edits.length} SQL edits`);
            return edits;
        }
        catch (error) {
            throw new Error(`LLM code generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Explain SQL code changes
     */
    async explainChanges(edits) {
        try {
            const prompt = this.buildExplanationPrompt(edits);
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful SQL expert. Explain the changes made to SQL code in clear, concise language.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 1000
            });
            return response.choices[0]?.message?.content || 'Unable to explain changes';
        }
        catch (error) {
            console.warn('Failed to generate explanation:', error);
            return 'Changes applied successfully (explanation unavailable)';
        }
    }
    /**
     * Generate DBT model documentation
     */
    async generateModelDocumentation(model, sqlContent) {
        try {
            const prompt = this.buildDocumentationPrompt(model, sqlContent);
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a data documentation expert. Generate clear, helpful documentation for DBT models and their columns.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 2000
            });
            const responseContent = response.choices[0]?.message?.content;
            if (!responseContent) {
                throw new Error('No response from LLM');
            }
            return this.parseDocumentationResponse(responseContent);
        }
        catch (error) {
            console.warn('Failed to generate documentation:', error);
            return {
                description: `${model.type} model: ${model.name}`,
                columnDescriptions: []
            };
        }
    }
    /**
     * Validate and improve SQL code
     */
    async improveSQLCode(sqlCode, issues) {
        try {
            const prompt = this.buildImprovementPrompt(sqlCode, issues);
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a SQL optimization expert. Improve SQL code for better performance, readability, and maintainability.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 3000
            });
            const responseContent = response.choices[0]?.message?.content;
            if (!responseContent) {
                throw new Error('No response from LLM');
            }
            return this.parseImprovementResponse(responseContent);
        }
        catch (error) {
            console.warn('Failed to improve SQL:', error);
            return {
                improvedCode: sqlCode,
                improvements: []
            };
        }
    }
    /**
     * Build system prompt for SQL editing
     */
    getSystemPrompt() {
        return `You are an expert SQL and DBT developer. Your role is to help users modify SQL code based on their natural language requests.

Key Guidelines:
1. Always provide valid, executable SQL code
2. Follow DBT best practices (use ref() for models, source() for sources)
3. Write clean, readable SQL with proper formatting
4. Consider performance implications
5. Preserve existing functionality unless explicitly asked to change it
6. Add helpful comments for complex logic
7. Use appropriate SQL functions for the Snowflake dialect

Response Format:
For each edit, provide a JSON object with:
- file: The file path
- originalCode: The original code section to replace
- newCode: The new code to replace it with
- lineStart: Starting line number
- lineEnd: Ending line number
- reason: Brief explanation of the change

Wrap your response in \`\`\`json and \`\`\` tags.`;
    }
    /**
     * Build edit generation prompt
     */
    buildEditPrompt(intent, ragResults, schema, dbtModels) {
        let prompt = `User Request: "${intent}"\n\n`;
        prompt += `Found Code Context:\n`;
        ragResults.snippets.forEach((snippet, index) => {
            prompt += `\n--- File: ${snippet.file} (Line ${snippet.lineNumber}) ---\n`;
            prompt += snippet.code;
            prompt += '\n';
        });
        if (schema) {
            prompt += `\nAvailable Snowflake Schema:\n`;
            prompt += `Database: ${schema.database}, Schema: ${schema.schema}\n`;
            prompt += `Tables: ${schema.tables.map(t => t.name).join(', ')}\n`;
        }
        if (dbtModels && dbtModels.length > 0) {
            prompt += `\nRelevant DBT Models:\n`;
            dbtModels.slice(0, 10).forEach(model => {
                prompt += `- ${model.name} (${model.type}): ${model.description || 'No description'}\n`;
            });
        }
        prompt += `\nPlease generate SQL edits to fulfill the user's request. Only modify the necessary parts of the code.`;
        return prompt;
    }
    /**
     * Build explanation prompt
     */
    buildExplanationPrompt(edits) {
        let prompt = `Please explain the following SQL changes in plain English:\n\n`;
        edits.forEach((edit, index) => {
            prompt += `Change ${index + 1} in ${edit.file}:\n`;
            prompt += `From:\n${edit.originalCode}\n`;
            prompt += `To:\n${edit.newCode}\n`;
            prompt += `Reason: ${edit.reason}\n\n`;
        });
        return prompt;
    }
    /**
     * Build documentation prompt
     */
    buildDocumentationPrompt(model, sqlContent) {
        let prompt = `Generate documentation for this DBT ${model.type}:\n\n`;
        prompt += `Name: ${model.name}\n`;
        prompt += `Path: ${model.path}\n`;
        if (model.dependencies.length > 0) {
            prompt += `Dependencies: ${model.dependencies.join(', ')}\n`;
        }
        if (sqlContent) {
            prompt += `\nSQL Content:\n${sqlContent}\n`;
        }
        if (model.columns && model.columns.length > 0) {
            prompt += `\nColumns:\n`;
            model.columns.forEach(col => {
                prompt += `- ${col.name} (${col.type || 'unknown'})\n`;
            });
        }
        prompt += `\nProvide a clear description for the model and descriptions for each column. Format as JSON:
{
  "description": "model description",
  "columnDescriptions": [
    {"name": "column_name", "description": "column description"}
  ]
}`;
        return prompt;
    }
    /**
     * Build improvement prompt
     */
    buildImprovementPrompt(sqlCode, issues) {
        let prompt = `Please improve this SQL code:\n\n${sqlCode}\n\n`;
        if (issues && issues.length > 0) {
            prompt += `Known Issues:\n`;
            issues.forEach(issue => {
                prompt += `- ${issue}\n`;
            });
            prompt += '\n';
        }
        prompt += `Please provide improved code and explain the improvements. Format as JSON:
{
  "improvedCode": "the improved SQL code",
  "improvements": ["list of improvements made"]
}`;
        return prompt;
    }
    /**
     * Parse edit response from LLM
     */
    parseEditResponse(response, contextSnippets) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const editsData = JSON.parse(jsonMatch[1]);
            const edits = [];
            // Handle both single edit and array of edits
            const editArray = Array.isArray(editsData) ? editsData : [editsData];
            for (const editData of editArray) {
                // Validate required fields
                if (!editData.file || !editData.newCode || !editData.reason) {
                    console.warn('Skipping invalid edit:', editData);
                    continue;
                }
                // Find matching snippet if originalCode not provided
                let originalCode = editData.originalCode;
                if (!originalCode) {
                    const matchingSnippet = contextSnippets.find(s => s.file === editData.file);
                    if (matchingSnippet) {
                        originalCode = matchingSnippet.code;
                    }
                }
                edits.push({
                    file: editData.file,
                    originalCode: originalCode || '',
                    newCode: editData.newCode,
                    lineStart: editData.lineStart || 1,
                    lineEnd: editData.lineEnd || 1,
                    reason: editData.reason
                });
            }
            return edits;
        }
        catch (error) {
            console.error('Failed to parse edit response:', error);
            console.log('Raw response:', response);
            throw new Error('Failed to parse LLM response');
        }
    }
    /**
     * Parse documentation response
     */
    parseDocumentationResponse(response) {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Fallback: extract description from text
                const lines = response.split('\n');
                const description = lines.find(line => line.trim().length > 10)?.trim() || 'No description available';
                return {
                    description,
                    columnDescriptions: []
                };
            }
            const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            return {
                description: data.description || 'No description available',
                columnDescriptions: data.columnDescriptions || []
            };
        }
        catch (error) {
            console.warn('Failed to parse documentation response:', error);
            return {
                description: 'No description available',
                columnDescriptions: []
            };
        }
    }
    /**
     * Parse improvement response
     */
    parseImprovementResponse(response) {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Fallback: look for code blocks
                const codeMatch = response.match(/```sql\s*([\s\S]*?)\s*```/);
                return {
                    improvedCode: codeMatch ? codeMatch[1] : response,
                    improvements: ['Code formatting improved']
                };
            }
            const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            return {
                improvedCode: data.improvedCode || response,
                improvements: data.improvements || []
            };
        }
        catch (error) {
            console.warn('Failed to parse improvement response:', error);
            return {
                improvedCode: response,
                improvements: []
            };
        }
    }
}
//# sourceMappingURL=llmService.js.map