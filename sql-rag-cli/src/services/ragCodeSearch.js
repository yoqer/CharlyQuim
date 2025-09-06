/**
 * RAG Code Search Service - Extracted from Void's context gathering system
 * This implements Void's intelligent code finding using semantic search
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

export class RAGCodeSearch {
  constructor(options = {}) {
    this.maxSnippetLines = options.maxSnippetLines || 7;
    this.numContextLines = options.numContextLines || 3;
    this.searchExtensions = options.extensions || ['.sql', '.py', '.js', '.ts'];
  }

  /**
   * Find relevant code based on user intent (Void's core RAG functionality)
   */
  async findRelevantCode(intent) {
    const results = [];
    
    // Step 1: Extract search terms from intent
    const searchTerms = this.extractSearchTerms(intent);
    
    // Step 2: Search for files using ripgrep (like Void's search_for_files)
    const fileMatches = await this.searchForFiles(searchTerms);
    
    // Step 3: For each file, gather context snippets (like Void's context gathering)
    for (const fileMatch of fileMatches) {
      const snippets = await this.gatherContextSnippets(fileMatch);
      results.push(...snippets);
    }
    
    // Step 4: Rank and deduplicate results
    const rankedResults = this.rankByRelevance(results, intent);
    
    return rankedResults.slice(0, 10); // Return top 10 most relevant
  }

  /**
   * Extract search terms from natural language intent
   */
  extractSearchTerms(intent) {
    // Simple keyword extraction - in a real implementation you might use NLP
    const sqlKeywords = ['SELECT', 'UPDATE', 'INSERT', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const businessTerms = intent.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Combine SQL keywords found in intent with business terms
    const terms = [];
    businessTerms.forEach(term => {
      if (term.length > 3) { // Ignore short words
        terms.push(term);
      }
    });
    
    sqlKeywords.forEach(keyword => {
      if (intent.toUpperCase().includes(keyword)) {
        terms.push(keyword);
      }
    });
    
    return [...new Set(terms)]; // Deduplicate
  }

  /**
   * Search for files using ripgrep (extracted from Void's toolsService)
   */
  async searchForFiles(searchTerms) {
    const results = [];
    
    for (const term of searchTerms) {
      try {
        // Use ripgrep to search files (same approach as Void)
        const rgCommand = `rg -l -i "${term}" --type sql --type py`;
        const output = execSync(rgCommand, { encoding: 'utf8' }).trim();
        
        if (output) {
          const files = output.split('\n');
          files.forEach(file => {
            if (!results.find(r => r.file === file)) {
              results.push({
                file: file,
                matchedTerm: term,
                score: 1 // Basic scoring
              });
            }
          });
        }
      } catch (error) {
        // Continue if ripgrep fails for a term
      }
    }
    
    return results;
  }

  /**
   * Gather context snippets around matches (extracted from Void's contextGatheringService)
   */
  async gatherContextSnippets(fileMatch) {
    try {
      const content = await fs.readFile(fileMatch.file, 'utf8');
      const lines = content.split('\n');
      const snippets = [];
      
      // Find lines that match the term
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(fileMatch.matchedTerm.toLowerCase())) {
          // Gather context around the match (like Void's _gatherNearbySnippets)
          const snippet = this.getSnippetForRange(
            lines, 
            index + 1, // Convert to 1-based line numbers
            this.numContextLines
          );
          
          if (snippet.trim()) {
            snippets.push({
              file: fileMatch.file,
              lineNumber: index + 1,
              matchedTerm: fileMatch.matchedTerm,
              code: snippet,
              score: fileMatch.score
            });
          }
        }
      });
      
      return snippets;
    } catch (error) {
      console.warn(`Could not read file ${fileMatch.file}:`, error.message);
      return [];
    }
  }

  /**
   * Get snippet for a range (extracted from Void's _getSnippetForRange)
   */
  getSnippetForRange(lines, centerLine, numContextLines) {
    const startLine = Math.max(centerLine - numContextLines - 1, 0);
    const endLine = Math.min(centerLine + numContextLines, lines.length);
    
    // Enforce maximum snippet size (like Void does)
    const totalLines = endLine - startLine;
    const adjustedStartLine = totalLines > this.maxSnippetLines 
      ? endLine - this.maxSnippetLines
      : startLine;
    
    const snippet = lines.slice(adjustedStartLine, endLine).join('\n');
    return this.cleanSnippet(snippet);
  }

  /**
   * Clean snippet (extracted from Void's _cleanSnippet)
   */
  cleanSnippet(snippet) {
    return snippet
      .split('\n')
      // Remove empty lines and lines with only comments
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !/^\/\/+$/.test(trimmed) && !/^--+$/.test(trimmed);
      })
      .join('\n')
      .trim();
  }

  /**
   * Rank results by relevance to the original intent
   */
  rankByRelevance(results, intent) {
    return results
      .map(result => {
        let score = result.score;
        
        // Boost score if code contains intent keywords
        const intentWords = intent.toLowerCase().split(/\s+/);
        intentWords.forEach(word => {
          if (result.code.toLowerCase().includes(word)) {
            score += 0.5;
          }
        });
        
        // Boost SQL files
        if (result.file.endsWith('.sql')) {
          score += 1;
        }
        
        // Boost if file name is relevant
        const fileName = path.basename(result.file).toLowerCase();
        intentWords.forEach(word => {
          if (fileName.includes(word)) {
            score += 0.5;
          }
        });
        
        return { ...result, score };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }
}