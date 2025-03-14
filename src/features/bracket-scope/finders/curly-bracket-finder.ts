import * as vscode from 'vscode';
import { BracketFinder, BracketPair } from '../types';

/**
 * Implements a bracket finder for languages that use curly brackets
 * (JavaScript, TypeScript, Java, C, C++, C#, etc.)
 */
export class CurlyBracketFinder implements BracketFinder {
  /**
   * The language IDs this finder supports
   * This is a constant for now, but could be made configurable in the future
   */
  public readonly languageId: string = '*'; // Supports all languages by default, can be refined later
  
  /**
   * Finds the nearest pair of curly brackets that contain the cursor position.
   * @param document The text document
   * @param cursorLine The cursor line number
   * @param cursorChar The cursor character position
   * @returns Bracket pair information or null if not found
   */
  public findBracketPairContainingCursor(
    document: vscode.TextDocument, 
    cursorLine: number, 
    cursorChar: number
  ): BracketPair | null {
    // Start from the cursor line and search backwards for the opening bracket
    let openBracketLine = -1;
    let openBracketChar = -1;
    let bracketStack = 0;
    
    // First search backwards from cursor to find a potential opening bracket
    for (let line = cursorLine; line >= 0; line--) {
      const lineText = document.lineAt(line).text;
      
      // If we're on the cursor line, only check characters before the cursor
      const endChar = line === cursorLine ? cursorChar : lineText.length;
      
      for (let char = endChar; char >= 0; char--) {
        if (lineText[char] === '}') {
          bracketStack++;
        } else if (lineText[char] === '{') {
          bracketStack--;
          
          // If we found the outermost opening bracket
          if (bracketStack === -1) {
            openBracketLine = line;
            openBracketChar = char;
            break;
          }
        }
      }
      
      if (openBracketLine !== -1) {
        break;
      }
    }
    
    // Reset the stack and search forward for the matching closing bracket
    if (openBracketLine !== -1) {
      bracketStack = 1; // We found one opening bracket
      let closeBracketLine = -1;
      let closeBracketChar = -1;
      
      for (let line = openBracketLine; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;
        
        // If we're on the opening bracket line, start searching after the opening bracket
        const startChar = line === openBracketLine ? openBracketChar + 1 : 0;
        
        for (let char = startChar; char < lineText.length; char++) {
          if (lineText[char] === '{') {
            bracketStack++;
          } else if (lineText[char] === '}') {
            bracketStack--;
            
            // If we found the matching closing bracket
            if (bracketStack === 0) {
              closeBracketLine = line;
              closeBracketChar = char;
              break;
            }
          }
        }
        
        if (closeBracketLine !== -1) {
          break;
        }
      }
      
      // Check if the cursor is within this bracket pair
      if (closeBracketLine !== -1) {
        const isAfterOpening = cursorLine > openBracketLine || 
                              (cursorLine === openBracketLine && cursorChar > openBracketChar);
        const isBeforeClosing = cursorLine < closeBracketLine || 
                               (cursorLine === closeBracketLine && cursorChar < closeBracketChar);
        
        if (isAfterOpening && isBeforeClosing) {
          return {
            openBracketLine,
            openBracketChar,
            closeBracketLine,
            closeBracketChar
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Finds the next pair of curly brackets after the cursor position.
   * @param document The text document
   * @param cursorLine The cursor line number
   * @param cursorChar The cursor character position
   * @returns Bracket pair information or null if not found
   */
  public findNextBracketPair(
    document: vscode.TextDocument, 
    cursorLine: number, 
    cursorChar: number
  ): BracketPair | null {
    let openBracketLine = -1;
    let openBracketChar = -1;
    
    // Search for the next opening bracket from the cursor position
    for (let line = cursorLine; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      
      // If we're on the cursor line, start searching from the cursor position
      const startChar = line === cursorLine ? cursorChar : 0;
      
      for (let char = startChar; char < lineText.length; char++) {
        if (lineText[char] === '{') {
          openBracketLine = line;
          openBracketChar = char;
          break;
        }
      }
      
      if (openBracketLine !== -1) {
        break;
      }
    }
    
    // If we found an opening bracket, find its matching closing bracket
    if (openBracketLine !== -1) {
      let bracketStack = 1; // We found one opening bracket
      let closeBracketLine = -1;
      let closeBracketChar = -1;
      
      for (let line = openBracketLine; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;
        
        // If we're on the opening bracket line, start searching after the opening bracket
        const startChar = line === openBracketLine ? openBracketChar + 1 : 0;
        
        for (let char = startChar; char < lineText.length; char++) {
          if (lineText[char] === '{') {
            bracketStack++;
          } else if (lineText[char] === '}') {
            bracketStack--;
            
            // If we found the matching closing bracket
            if (bracketStack === 0) {
              closeBracketLine = line;
              closeBracketChar = char;
              break;
            }
          }
        }
        
        if (closeBracketLine !== -1) {
          break;
        }
      }
      
      if (closeBracketLine !== -1) {
        return {
          openBracketLine,
          openBracketChar,
          closeBracketLine,
          closeBracketChar
        };
      }
    }
    
    return null;
  }
}
