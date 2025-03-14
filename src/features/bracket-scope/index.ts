import * as vscode from 'vscode';
import { CommandRegistry, FeatureModule } from '../../core';

/**
 * Interface for bracket pair positions
 */
interface BracketPair {
  openBracketLine: number;
  openBracketChar: number;
  closeBracketLine: number;
  closeBracketChar: number;
}

/**
 * Feature module for bracket scope operations
 * Provides functionality to delete the content between bracket pairs
 */
export class BracketScopeFeature extends FeatureModule {
  /**
   * Create a new BracketScopeFeature
   * @param commandRegistry The command registry service
   */
  constructor(commandRegistry: CommandRegistry) {
    super(commandRegistry, 'Bracket Scope');
  }

  /**
   * Register the bracket scope command
   */
  register(): void {
    const disposable = this.commandRegistry.registerTextEditorCommand(
      'extension.deleteCurrentBracketScope',
      this.handleDeleteBracketScope.bind(this)
    );
    
    this.addDisposable(disposable);
  }

  /**
   * Handle the delete bracket scope command
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Optional cursor position (defaults to current selection)
   */
  private async handleDeleteBracketScope(
    editor: vscode.TextEditor, 
    edit: vscode.TextEditorEdit, 
    position?: vscode.Position
  ): Promise<void> {
    const document = editor.document;
    
    // If position is not provided, use the active selection position
    const cursorPosition = position || editor.selection.active;
    const cursorLine = cursorPosition.line;
    const cursorChar = cursorPosition.character;
    
    // First, try to find the nearest bracket pair containing the cursor
    const bracketRange = this.findBracketPairContainingCursor(document, cursorLine, cursorChar);
    
    if (bracketRange) {
      // Delete the content between brackets (excluding the brackets themselves)
      await editor.edit(editBuilder => {
        editBuilder.delete(new vscode.Range(
          bracketRange.openBracketLine, bracketRange.openBracketChar + 1, // Start after the opening bracket
          bracketRange.closeBracketLine, bracketRange.closeBracketChar // End before the closing bracket
        ));
      });
      
      vscode.window.showInformationMessage("Deleted content between brackets.");
    } else {
      // If no bracket pair contains the cursor, look for the next bracket pair
      const nextBracketRange = this.findNextBracketPair(document, cursorLine, cursorChar);
      
      if (nextBracketRange) {
        // Delete the content between the next bracket pair (excluding the brackets)
        await editor.edit(editBuilder => {
          editBuilder.delete(new vscode.Range(
            nextBracketRange.openBracketLine, nextBracketRange.openBracketChar + 1, // Start after the opening bracket
            nextBracketRange.closeBracketLine, nextBracketRange.closeBracketChar // End before the closing bracket
          ));
        });
        
        vscode.window.showInformationMessage("Deleted content between next bracket pair.");
      } else {
        vscode.window.showInformationMessage("No bracket scope found.");
      }
    }
  }

  /**
   * Finds the nearest pair of curly brackets that contain the cursor position.
   * @param document The text document
   * @param cursorLine The cursor line number
   * @param cursorChar The cursor character position
   * @returns Bracket pair information or null if not found
   */
  private findBracketPairContainingCursor(
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
  private findNextBracketPair(
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
