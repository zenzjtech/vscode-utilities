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
   * Deletes the content between the bracket pair that contains the cursor
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
    
    // Check if highlighting is enabled in configuration
    const config = vscode.workspace.getConfiguration('vscodeUtilities');
    const highlightBeforeDeleting = config.get<boolean>('highlightBeforeDeleting', false);
    const copyToClipboard = config.get<boolean>('copyToClipboard', true);
    
    // First, try to find the nearest bracket pair containing the cursor
    const bracketRange = this.findBracketPairContainingCursor(document, cursorLine, cursorChar);
    
    if (bracketRange) {
      // Create a range for the content between brackets (excluding the brackets themselves)
      const contentRange = new vscode.Range(
        new vscode.Position(bracketRange.openBracketLine, bracketRange.openBracketChar + 1), // Start after the opening bracket
        new vscode.Position(bracketRange.closeBracketLine, bracketRange.closeBracketChar) // End before the closing bracket
      );
      
      // Calculate lines removed
      const linesRemoved = bracketRange.closeBracketLine - bracketRange.openBracketLine + 1;
      
      // Get line for context where the brackets are
      let contextText = "";
      try {
        // Try to extract some context from the surrounding code
        const lineText = document.lineAt(bracketRange.openBracketLine).text.trim();
        const contextMatch = lineText.match(/(\w+)\s*{/);
        if (contextMatch && contextMatch.length > 1) {
          contextText = ` in '${contextMatch[1]}'`;
        }
      } catch (e) {
        // Ignore any errors in getting context
      }
      
      if (highlightBeforeDeleting) {
        // Highlight the content and ask for confirmation
        if (await this.highlightAndConfirmBracketDeletion(editor, contentRange, `bracket content${contextText}`, linesRemoved)) {
          // Get the text content
          const contentText = document.getText(contentRange);
          
          // Copy to clipboard if enabled
          if (copyToClipboard) {
            await vscode.env.clipboard.writeText(contentText);
          }
          
          // Delete the content between brackets (excluding the brackets themselves)
          await editor.edit(editBuilder => {
            editBuilder.delete(contentRange);
          });
          
          // Show detailed message with expanded information
          const message = `Deleted content between brackets${contextText}`;
          let detailMessage = `From line ${bracketRange.openBracketLine + 1} to ${bracketRange.closeBracketLine + 1} (${linesRemoved} lines affected)`;
          
          // Add clipboard info to the message if enabled
          if (copyToClipboard) {
            detailMessage += ". Content copied to clipboard.";
          }
          
          // Use information message type with detail option for expanded view
          vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
        }
      } else {
        // Delete without highlighting
        
        // Get the text content
        const contentText = document.getText(contentRange);
        
        // Copy to clipboard if enabled
        if (copyToClipboard) {
          await vscode.env.clipboard.writeText(contentText);
        }
        
        await editor.edit(editBuilder => {
          editBuilder.delete(contentRange);
        });
        
        // Show detailed message with expanded information
        const message = `Deleted content between brackets${contextText}`;
        let detailMessage = `From line ${bracketRange.openBracketLine + 1} to ${bracketRange.closeBracketLine + 1} (${linesRemoved} lines affected)`;
        
        // Add clipboard info to the message if enabled
        if (copyToClipboard) {
          detailMessage += ". Content copied to clipboard.";
        }
        
        // Use information message type with detail option for expanded view
        vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
      }
    } else {
      // If no bracket pair contains the cursor, look for the next bracket pair
      const nextBracketRange = this.findNextBracketPair(document, cursorLine, cursorChar);
      
      if (nextBracketRange) {
        // Create a range for the content between the next bracket pair (excluding the brackets)
        const contentRange = new vscode.Range(
          new vscode.Position(nextBracketRange.openBracketLine, nextBracketRange.openBracketChar + 1), // Start after the opening bracket
          new vscode.Position(nextBracketRange.closeBracketLine, nextBracketRange.closeBracketChar) // End before the closing bracket
        );
        
        // Calculate lines removed
        const linesRemoved = nextBracketRange.closeBracketLine - nextBracketRange.openBracketLine + 1;
        
        // Get line for context where the brackets are
        let contextText = "";
        try {
          // Try to extract some context from the surrounding code
          const lineText = document.lineAt(nextBracketRange.openBracketLine).text.trim();
          const contextMatch = lineText.match(/(\w+)\s*{/);
          if (contextMatch && contextMatch.length > 1) {
            contextText = ` in '${contextMatch[1]}'`;
          }
        } catch (e) {
          // Ignore any errors in getting context
        }
        
        if (highlightBeforeDeleting) {
          // Highlight the content and ask for confirmation
          if (await this.highlightAndConfirmBracketDeletion(editor, contentRange, `next bracket pair content${contextText}`, linesRemoved)) {
            // Get the text content
            const contentText = document.getText(contentRange);
            
            // Copy to clipboard if enabled
            if (copyToClipboard) {
              await vscode.env.clipboard.writeText(contentText);
            }
            
            // Delete the content between the next bracket pair (excluding the brackets)
            await editor.edit(editBuilder => {
              editBuilder.delete(contentRange);
            });
            
            // Show detailed message with expanded information
            const message = `Deleted content between next bracket pair${contextText}`;
            let detailMessage = `From line ${nextBracketRange.openBracketLine + 1} to ${nextBracketRange.closeBracketLine + 1} (${linesRemoved} lines affected)`;
            
            // Add clipboard info to the message if enabled
            if (copyToClipboard) {
              detailMessage += ". Content copied to clipboard.";
            }
            
            // Use warning message type for a different icon
            vscode.window.showWarningMessage(message, { detail: detailMessage, modal: false });
          }
        } else {
          // Delete without highlighting
          
          // Get the text content
          const contentText = document.getText(contentRange);
          
          // Copy to clipboard if enabled
          if (copyToClipboard) {
            await vscode.env.clipboard.writeText(contentText);
          }
          
          await editor.edit(editBuilder => {
            editBuilder.delete(contentRange);
          });
          
          // Show detailed message with expanded information
          const message = `Deleted content between next bracket pair${contextText}`;
          let detailMessage = `From line ${nextBracketRange.openBracketLine + 1} to ${nextBracketRange.closeBracketLine + 1} (${linesRemoved} lines affected)`;
          
          // Add clipboard info to the message if enabled
          if (copyToClipboard) {
            detailMessage += ". Content copied to clipboard.";
          }
          
          // Use warning message type for a different icon
          vscode.window.showWarningMessage(message, { detail: detailMessage, modal: false });
        }
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

  /**
   * Highlight the bracket content that will be deleted and ask for confirmation
   * @param editor The active text editor
   * @param contentRange Range of content to highlight and potentially delete
   * @param contextDescription Description of what will be deleted
   * @param linesRemoved Number of lines affected
   * @returns True if the user confirms deletion, false otherwise
   */
  private async highlightAndConfirmBracketDeletion(
    editor: vscode.TextEditor, 
    contentRange: vscode.Range, 
    contextDescription: string, 
    linesRemoved: number
  ): Promise<boolean> {
    // Store the original selections
    const originalSelections = [...editor.selections];
    
    // Create a new selection that covers the entire content range
    editor.selection = new vscode.Selection(
      contentRange.start,
      contentRange.end
    );
    
    // Create a decoration type for the highlighting
    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
      border: '1px solid',
      borderColor: new vscode.ThemeColor('editor.selectionHighlightBorder')
    });
    
    // Apply the decoration
    editor.setDecorations(decorationType, [contentRange]);
    
    // Scroll to show the highlighted area
    editor.revealRange(contentRange, vscode.TextEditorRevealType.InCenter);
    
    // Ask for confirmation
    const result = await vscode.window.showWarningMessage(
      `Delete ${contextDescription}?`,
      { detail: `This will remove content spanning ${linesRemoved} lines (from line ${contentRange.start.line + 1} to ${contentRange.end.line + 1})`, modal: false },
      { title: 'Delete', isCloseAffordance: false },
      { title: 'Cancel', isCloseAffordance: true }
    );
    
    // Remove the decoration
    decorationType.dispose();
    
    // Restore the original selections
    editor.selections = originalSelections;
    
    // Return true if the user clicked 'Delete'
    return result?.title === 'Delete';
  }
}
