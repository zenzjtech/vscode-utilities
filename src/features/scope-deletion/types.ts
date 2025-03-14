import * as vscode from 'vscode';

/**
 * Types of scope that can be identified and managed
 */
export type ScopeType = 'function' | 'class' | 'interface' | 'enum';

/**
 * Information about a detected scope
 */
export interface ScopeInfo {
  /**
   * The type of scope (function, class, interface, enum)
   */
  scopeType: ScopeType;
  
  /**
   * The name of the scope, if available
   */
  name: string;
  
  /**
   * The starting line of the scope
   */
  startLine: number;
}

/**
 * Interface for language-specific scope finders
 */
export interface ScopeFinder {
  /**
   * The language ID this finder supports
   */
  readonly languageId: string;
  
  /**
   * Find a function that contains the given position
   * @param document The text document
   * @param position The position to check
   * @returns An object with scope information if found, or null if not found
   */
  findContainingFunction(
    document: vscode.TextDocument,
    position: vscode.Position
  ): ScopeInfo | null;
  
  /**
   * Find a class, interface, or enum that contains the given position
   * @param document The text document
   * @param position The position to check
   * @returns An object with scope information if found, or null if not found
   */
  findContainingClass(
    document: vscode.TextDocument,
    position: vscode.Position
  ): ScopeInfo | null;
  
  /**
   * Find the end line of a scope starting from a given line
   * @param document The text document
   * @param startLine The line where the scope starts
   * @param currentLine The current line (cursor position)
   * @returns The end line of the scope if the currentLine is within the scope, or null if not found
   */
  findScopeBoundary(
    document: vscode.TextDocument,
    startLine: number,
    currentLine: number
  ): number | null;
  
  /**
   * Extract a scope name from a line of text
   * @param lineText The line text to extract from
   * @param scopeType The type of scope
   * @returns The extracted name or "unnamed" if not found
   */
  extractScopeName(
    lineText: string,
    scopeType: ScopeType
  ): string;
}
