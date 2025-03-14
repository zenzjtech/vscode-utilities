import * as vscode from 'vscode';

/**
 * Interface for bracket pair positions
 */
export interface BracketPair {
  openBracketLine: number;
  openBracketChar: number;
  closeBracketLine: number;
  closeBracketChar: number;
}

/**
 * Interface for language-specific bracket finders
 */
export interface BracketFinder {
  /**
   * The language ID this finder supports
   */
  readonly languageId: string;
  
  /**
   * Finds the nearest pair of brackets that contain the cursor position.
   * @param document The text document
   * @param cursorLine The cursor line number
   * @param cursorChar The cursor character position
   * @returns Bracket pair information or null if not found
   */
  findBracketPairContainingCursor(
    document: vscode.TextDocument, 
    cursorLine: number, 
    cursorChar: number
  ): BracketPair | null;
  
  /**
   * Finds the next pair of brackets after the cursor position.
   * @param document The text document
   * @param cursorLine The cursor line number
   * @param cursorChar The cursor character position
   * @returns Bracket pair information or null if not found
   */
  findNextBracketPair(
    document: vscode.TextDocument, 
    cursorLine: number, 
    cursorChar: number
  ): BracketPair | null;
}
