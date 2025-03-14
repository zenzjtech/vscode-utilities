import * as vscode from 'vscode';

/**
 * Interface for S-expression boundary positions
 */
export interface SexpBoundary {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

/**
 * Interface for language-specific sexp navigation
 */
export interface SexpNavigator {
  /**
   * The language ID this navigator supports
   */
  readonly languageId: string;
  
  /**
   * Find the next balanced expression from the current cursor position
   * @param document The text document
   * @param position The current cursor position
   * @returns The boundary of the next sexp or null if not found
   */
  findForwardSexp(
    document: vscode.TextDocument, 
    position: vscode.Position
  ): SexpBoundary | null;
  
  /**
   * Find the previous balanced expression from the current cursor position
   * @param document The text document
   * @param position The current cursor position
   * @returns The boundary of the previous sexp or null if not found
   */
  findBackwardSexp(
    document: vscode.TextDocument, 
    position: vscode.Position
  ): SexpBoundary | null;
}
