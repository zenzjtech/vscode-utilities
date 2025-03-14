import * as vscode from 'vscode';
import { ScopeInfo, ScopeFinder, ScopeType } from '../types';

/**
 * Scope finder implementation for TypeScript/JavaScript
 */
export class TypeScriptScopeFinder implements ScopeFinder {
  /**
   * The language ID this finder supports
   */
  public readonly languageId: string = 'typescript';

  /**
   * Find a function that contains the given position
   * @param document The text document
   * @param position The position to check
   * @returns An object with scope information if found, or null if not found
   */
  public findContainingFunction(
    document: vscode.TextDocument,
    position: vscode.Position
  ): ScopeInfo | null {
    const maxLines = document.lineCount;
    const currentLine = position.line;
    
    // Search upward for function definition
    for (let line = currentLine; line >= 0; line--) {
      const lineText = document.lineAt(line).text.trim();
      
      // Check for function definitions
      const isFunctionDef = 
        /^(async\s+function|function)\s+\w+\s*\(/.test(lineText) || 
        /^(async\s+)?(\w+)\s*\(\s*.*\s*\)\s*(\{|=>)/.test(lineText) || 
        /^(const|let|var)\s+\w+\s*=\s*(async\s*)?\(\s*.*\s*\)\s*=>/.test(lineText) ||
        (/^(async\s+)?[\w_$]+\s*(\(|\<)/.test(lineText) && lineText.includes('('));
      
      if (isFunctionDef) {
        // Verify if this function contains the current position
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { 
            scopeType: 'function', 
            name: this.extractScopeName(lineText, 'function'),
            startLine: line 
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Find a class, interface, or enum that contains the given position
   * @param document The text document
   * @param position The position to check
   * @returns An object with scope information if found, or null if not found
   */
  public findContainingClass(
    document: vscode.TextDocument,
    position: vscode.Position
  ): ScopeInfo | null {
    const maxLines = document.lineCount;
    const currentLine = position.line;
    
    // Search upward for class, interface, or enum definition
    for (let line = currentLine; line >= 0; line--) {
      const lineText = document.lineAt(line).text.trim();
      
      // Check for enum definition
      if (/^(export\s+)?(declare\s+)?enum\s+\w+/.test(lineText)) {
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { 
            scopeType: 'enum', 
            name: this.extractScopeName(lineText, 'enum'),
            startLine: line 
          };
        }
      }
      
      // Check for interface definition
      if (/^(export\s+)?(declare\s+)?interface\s+\w+/.test(lineText)) {
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { 
            scopeType: 'interface',
            name: this.extractScopeName(lineText, 'interface'),
            startLine: line 
          };
        }
      }
      
      // Check for class definition - improved to handle TypeScript decorators and export patterns
      if (/^(export\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText) || 
          (line > 0 && /^@\w+/.test(document.lineAt(line - 1).text.trim()) && /^(export\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText)) ||
          /^(export\s+)?(declare\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText)) {
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { 
            scopeType: 'class', 
            name: this.extractScopeName(lineText, 'class'),
            startLine: line 
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Find the end line of a scope starting from a given line
   * @param document The text document
   * @param startLine The line where the scope starts
   * @param currentLine The current line (cursor position)
   * @returns The end line of the scope if the currentLine is within the scope, or null if not found
   */
  public findScopeBoundary(
    document: vscode.TextDocument,
    startLine: number,
    currentLine: number
  ): number | null {
    const maxLines = document.lineCount;
    let bracketCount = 0;
    let foundOpeningBracket = false;
    
    for (let i = startLine; i < maxLines; i++) {
      const bracketLine = document.lineAt(i).text;
      
      // Count brackets
      for (let char = 0; char < bracketLine.length; char++) {
        if (bracketLine[char] === '{') {
          foundOpeningBracket = true;
          bracketCount++;
        } else if (bracketLine[char] === '}') {
          bracketCount--;
          
          // If brackets are balanced and we found the closing bracket
          if (foundOpeningBracket && bracketCount === 0) {
            // Check if current position is within this range
            if (i >= currentLine) {
              return i; // End line of the scope
            } else {
              // This scope ends before our current position, so it doesn't contain it
              return null;
            }
          }
        }
      }
    }
    
    return null; // No balanced closing bracket found
  }

  /**
   * Extract a scope name from a line of text
   * @param lineText The line text to extract from
   * @param scopeType The type of scope
   * @returns The extracted name or "unnamed" if not found
   */
  public extractScopeName(
    lineText: string,
    scopeType: ScopeType
  ): string {
    let scopeName = "unnamed";
      
    // Try to extract the name based on the scope type
    const nameMatch = lineText.match(new RegExp(`(${scopeType})\\s+(\\w+)`, 'i'));
    if (nameMatch && nameMatch.length > 2) {
      scopeName = nameMatch[2];
    } else {
      // Alternative pattern for function expressions or methods
      const altMatch = lineText.match(/(\w+)\s*[\(=]/);
      if (altMatch && altMatch.length > 1) {
        scopeName = altMatch[1];
      }
    }
    
    return scopeName;
  }

  /**
   * Helper utility to get indentation level
   * @param line The line to extract indentation from
   * @returns The indentation string
   */
  public getIndentation(line: string): string {
    return line.match(/^(\s*)/)![1];
  }
}
