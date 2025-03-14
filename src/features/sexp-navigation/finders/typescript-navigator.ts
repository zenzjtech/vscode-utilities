import * as vscode from 'vscode';
import { SexpBoundary, SexpNavigator } from '../types';

/**
 * Sexp navigator implementation for TypeScript/JavaScript
 * Handles finding balanced expressions like brackets, parentheses, etc.
 */
export class TypeScriptSexpNavigator implements SexpNavigator {
  public readonly languageId: string = 'typescript';

  /**
   * Finds the next balanced expression from the current cursor position
   * @param document The text document
   * @param position The current cursor position
   * @returns The boundary of the next sexp or null if not found
   */
  public findForwardSexp(
    document: vscode.TextDocument,
    position: vscode.Position
  ): SexpBoundary | null {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Characters to look for
    const openingChars = ['(', '[', '{'];
    const closingChars = [')', ']', '}'];
    const matchingPairs: { [key: string]: string } = {
      '(': ')',
      '[': ']',
      '{': '}',
      ')': '(',
      ']': '[',
      '}': '{'
    };

    // Try to find the next balanced expression
    let currentPosition = offset;
    while (currentPosition < text.length) {
      const char = text[currentPosition];
      
      // If we find an opening character, find its matching closing character
      if (openingChars.includes(char)) {
        const startPosition = currentPosition;
        const endPosition = this.findMatchingClosingChar(text, currentPosition, char, matchingPairs[char]);
        
        if (endPosition !== -1) {
          const startPos = document.positionAt(startPosition);
          const endPos = document.positionAt(endPosition + 1); // +1 to include the closing character
          
          return {
            startLine: startPos.line,
            startChar: startPos.character,
            endLine: endPos.line,
            endChar: endPos.character
          };
        }
      } 
      // If we're at a word/identifier, find the end of it
      else if (/[a-zA-Z0-9_$]/.test(char)) {
        const startPosition = currentPosition;
        while (
          currentPosition < text.length && 
          /[a-zA-Z0-9_$]/.test(text[currentPosition])
        ) {
          currentPosition++;
        }
        
        const startPos = document.positionAt(startPosition);
        const endPos = document.positionAt(currentPosition);
        
        return {
          startLine: startPos.line,
          startChar: startPos.character,
          endLine: endPos.line,
          endChar: endPos.character
        };
      }
      
      currentPosition++;
    }
    
    return null;
  }

  /**
   * Finds the previous balanced expression from the current cursor position
   * @param document The text document
   * @param position The current cursor position
   * @returns The boundary of the previous sexp or null if not found
   */
  public findBackwardSexp(
    document: vscode.TextDocument,
    position: vscode.Position
  ): SexpBoundary | null {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Characters to look for
    const openingChars = ['(', '[', '{'];
    const closingChars = [')', ']', '}'];
    const matchingPairs: { [key: string]: string } = {
      '(': ')',
      '[': ']',
      '{': '}',
      ')': '(',
      ']': '[',
      '}': '{'
    };

    // Try to find the previous balanced expression
    let currentPosition = offset - 1;
    while (currentPosition >= 0) {
      const char = text[currentPosition];
      
      // If we find a closing character, find its matching opening character
      if (closingChars.includes(char)) {
        const endPosition = currentPosition;
        const startPosition = this.findMatchingOpeningChar(text, currentPosition, char, matchingPairs[char]);
        
        if (startPosition !== -1) {
          const startPos = document.positionAt(startPosition);
          const endPos = document.positionAt(endPosition + 1); // +1 to include the closing character
          
          return {
            startLine: startPos.line,
            startChar: startPos.character,
            endLine: endPos.line,
            endChar: endPos.character
          };
        }
      } 
      // If we're at a word/identifier, find the start of it
      else if (/[a-zA-Z0-9_$]/.test(char)) {
        const endPosition = currentPosition;
        while (
          currentPosition >= 0 && 
          /[a-zA-Z0-9_$]/.test(text[currentPosition])
        ) {
          currentPosition--;
        }
        
        // Adjust the start position to point to the first character of the word
        const startPos = document.positionAt(currentPosition + 1);
        const endPos = document.positionAt(endPosition + 1);
        
        return {
          startLine: startPos.line,
          startChar: startPos.character,
          endLine: endPos.line,
          endChar: endPos.character
        };
      }
      
      currentPosition--;
    }
    
    return null;
  }

  /**
   * Finds the matching closing character for a given opening character
   * @param text The text to search in
   * @param position The position of the opening character
   * @param openChar The opening character
   * @param closeChar The corresponding closing character
   * @returns The position of the matching closing character or -1 if not found
   */
  private findMatchingClosingChar(
    text: string,
    position: number,
    openChar: string,
    closeChar: string
  ): number {
    let depth = 0;
    let currentPosition = position;
    
    while (currentPosition < text.length) {
      const char = text[currentPosition];
      
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return currentPosition;
        }
      }
      
      currentPosition++;
    }
    
    return -1;
  }

  /**
   * Finds the matching opening character for a given closing character
   * @param text The text to search in
   * @param position The position of the closing character
   * @param closeChar The closing character
   * @param openChar The corresponding opening character
   * @returns The position of the matching opening character or -1 if not found
   */
  private findMatchingOpeningChar(
    text: string,
    position: number,
    closeChar: string,
    openChar: string
  ): number {
    let depth = 0;
    let currentPosition = position;
    
    while (currentPosition >= 0) {
      const char = text[currentPosition];
      
      if (char === closeChar) {
        depth++;
      } else if (char === openChar) {
        depth--;
        if (depth === 0) {
          return currentPosition;
        }
      }
      
      currentPosition--;
    }
    
    return -1;
  }
}
