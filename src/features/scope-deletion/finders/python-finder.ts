import * as vscode from 'vscode';
import { ScopeInfo, ScopeFinder, ScopeType } from '../types';

/**
 * Scope finder implementation for Python
 */
export class PythonScopeFinder implements ScopeFinder {
  /**
   * The language ID this finder supports
   */
  public readonly languageId: string = 'python';

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
      const lineText = document.lineAt(line).text;
      
      // Check for Python function definitions (def keyword)
      const isFunctionDef = /^\s*def\s+\w+\s*\(/.test(lineText);
      
      if (isFunctionDef) {
        // Get the indentation level of this function
        const functionIndent = this.getIndentation(lineText);
        
        // Verify if this function contains the current position by checking indentation
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine, functionIndent);
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
   * Find a class that contains the given position
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
    
    // Search upward for class definition
    for (let line = currentLine; line >= 0; line--) {
      const lineText = document.lineAt(line).text;
      
      // Check for Python class definition
      const isClassDef = /^\s*class\s+\w+/.test(lineText);
      
      if (isClassDef) {
        // Get the indentation level of this class
        const classIndent = this.getIndentation(lineText);
        
        // Verify if this class contains the current position by checking indentation
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine, classIndent);
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
   * @param baseIndent The indentation of the scope definition line
   * @returns The end line of the scope if the currentLine is within the scope, or null if not found
   */
  public findScopeBoundary(
    document: vscode.TextDocument,
    startLine: number,
    currentLine: number,
    baseIndent?: string
  ): number | null {
    const maxLines = document.lineCount;
    
    // If no baseIndent was provided, calculate it from the startLine
    if (!baseIndent) {
      baseIndent = this.getIndentation(document.lineAt(startLine).text);
    }
    
    // Check if currentLine is at or after startLine
    if (currentLine < startLine) {
      return null;
    }
    
    // Get the expected indentation level of the scope body (one level deeper than base)
    const expectedBodyIndent = baseIndent + '    '; // Python typically uses 4 spaces
    
    // Skip the definition line and look at body
    let line = startLine + 1;
    
    // Handle the case where there are decorators or comments before the actual body
    while (line < maxLines) {
      const lineText = document.lineAt(line).text;
      
      // Skip empty lines or comment lines
      if (lineText.trim() === '' || lineText.trim().startsWith('#')) {
        line++;
        continue;
      }
      
      // If we find a line with less or equal indentation than the base, 
      // the scope has ended
      const currentIndent = this.getIndentation(lineText);
      
      if (currentIndent.length <= baseIndent.length && lineText.trim() !== '') {
        // We found the end of the scope
        const endLine = line - 1;
        
        // Check if currentLine is within this range
        if (currentLine <= endLine) {
          return endLine;
        } else {
          // This scope ends before our current position
          return null;
        }
      }
      
      line++;
    }
    
    // If we reach the end of the file, the scope extends to the end
    if (currentLine <= maxLines - 1) {
      return maxLines - 1;
    }
    
    return null;
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
    
    if (scopeType === 'function') {
      // Extract function name from 'def function_name(...'
      const functionMatch = lineText.match(/def\s+(\w+)\s*\(/);
      if (functionMatch && functionMatch.length > 1) {
        scopeName = functionMatch[1];
      }
    } else if (scopeType === 'class') {
      // Extract class name from 'class ClassName(...'
      const classMatch = lineText.match(/class\s+(\w+)(?:\(|\:)/);
      if (classMatch && classMatch.length > 1) {
        scopeName = classMatch[1];
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
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }
}
