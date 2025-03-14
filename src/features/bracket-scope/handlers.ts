import * as vscode from 'vscode';
import { BracketPair } from './types';
import { BracketFinderFactory } from './finders';
import { BracketScopeUIUtils } from './ui-utils';

/**
 * Command handlers for bracket scope operations
 */
export class BracketScopeHandlers {
  private finderFactory: BracketFinderFactory;

  constructor() {
    this.finderFactory = new BracketFinderFactory();
  }

  /**
   * Deletes the content between the bracket pair that contains the cursor
   */
  public async handleDeleteBracketScope(
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
    
    // Get the appropriate finder for this document's language
    const finder = this.finderFactory.getFinderForDocument(document);
    
    // First, try to find the nearest bracket pair containing the cursor
    const bracketRange = finder.findBracketPairContainingCursor(document, cursorLine, cursorChar);
    
    if (bracketRange) {
      await this.deleteBracketContent(
        editor, 
        bracketRange, 
        highlightBeforeDeleting, 
        copyToClipboard, 
        false
      );
    } else {
      // If no bracket pair contains the cursor, look for the next bracket pair
      const nextBracketRange = finder.findNextBracketPair(document, cursorLine, cursorChar);
      
      if (nextBracketRange) {
        await this.deleteBracketContent(
          editor, 
          nextBracketRange, 
          highlightBeforeDeleting, 
          copyToClipboard, 
          true
        );
      } else {
        vscode.window.showInformationMessage("No bracket scope found.");
      }
    }
  }

  /**
   * Selects the content between the bracket pair that contains the cursor and copies it to clipboard
   */
  public async handleSelectBracketScope(
    editor: vscode.TextEditor, 
    edit: vscode.TextEditorEdit, 
    position?: vscode.Position
  ): Promise<void> {
    const document = editor.document;
    
    // If position is not provided, use the active selection position
    const cursorPosition = position || editor.selection.active;
    const cursorLine = cursorPosition.line;
    const cursorChar = cursorPosition.character;
    
    // Get the appropriate finder for this document's language
    const finder = this.finderFactory.getFinderForDocument(document);
    
    // First, try to find the nearest bracket pair containing the cursor
    const bracketRange = finder.findBracketPairContainingCursor(document, cursorLine, cursorChar);
    
    if (bracketRange) {
      await this.selectBracketContent(editor, bracketRange, false);
    } else {
      // If no bracket pair contains the cursor, look for the next bracket pair
      const nextBracketRange = finder.findNextBracketPair(document, cursorLine, cursorChar);
      
      if (nextBracketRange) {
        await this.selectBracketContent(editor, nextBracketRange, true);
      } else {
        // No bracket pair found
        vscode.window.showErrorMessage('No bracket scope found at or after the cursor position.');
      }
    }
  }

  /**
   * Helper method to delete content between brackets
   */
  private async deleteBracketContent(
    editor: vscode.TextEditor,
    bracketRange: BracketPair,
    highlightBeforeDeleting: boolean,
    copyToClipboard: boolean,
    isNextBracket: boolean
  ): Promise<void> {
    const document = editor.document;
    
    // Create a range for the content between brackets (excluding the brackets themselves)
    const contentRange = new vscode.Range(
      new vscode.Position(bracketRange.openBracketLine, bracketRange.openBracketChar + 1), // Start after the opening bracket
      new vscode.Position(bracketRange.closeBracketLine, bracketRange.closeBracketChar) // End before the closing bracket
    );
    
    // Calculate lines removed
    const linesRemoved = bracketRange.closeBracketLine - bracketRange.openBracketLine + 1;
    
    // Get context text
    const contextText = BracketScopeUIUtils.getContextFromBracketLine(document, bracketRange.openBracketLine);
    
    if (highlightBeforeDeleting) {
      // Highlight the content and ask for confirmation
      const contextDescription = isNextBracket ? `next bracket pair content${contextText}` : `bracket content${contextText}`;
      
      if (await BracketScopeUIUtils.highlightAndConfirmBracketDeletion(
        editor, contentRange, contextDescription, linesRemoved
      )) {
        await this.performDeletion(editor, contentRange, bracketRange, copyToClipboard, isNextBracket, contextText);
      }
    } else {
      // Delete without highlighting
      await this.performDeletion(editor, contentRange, bracketRange, copyToClipboard, isNextBracket, contextText);
    }
  }
  
  /**
   * Perform the actual deletion of bracket content
   */
  private async performDeletion(
    editor: vscode.TextEditor,
    contentRange: vscode.Range,
    bracketRange: BracketPair,
    copyToClipboard: boolean,
    isNextBracket: boolean,
    contextText: string
  ): Promise<void> {
    const document = editor.document;
    
    // Get the text content
    const contentText = document.getText(contentRange);
    
    // Copy to clipboard if enabled
    if (copyToClipboard) {
      await vscode.env.clipboard.writeText(contentText);
    }
    
    // Delete the content
    await editor.edit(editBuilder => {
      editBuilder.delete(contentRange);
    });
    
    // Calculate lines removed
    const linesRemoved = bracketRange.closeBracketLine - bracketRange.openBracketLine + 1;
    
    // Show detailed message with expanded information
    const message = isNextBracket 
      ? `Deleted content between next bracket pair${contextText}`
      : `Deleted content between brackets${contextText}`;
      
    let detailMessage = `From line ${bracketRange.openBracketLine + 1} to ${bracketRange.closeBracketLine + 1} (${linesRemoved} lines affected)`;
    
    // Add clipboard info to the message if enabled
    if (copyToClipboard) {
      detailMessage += ". Content copied to clipboard.";
    }
    
    // Show the message
    BracketScopeUIUtils.showBracketOperationMessage(message, detailMessage, isNextBracket);
  }

  /**
   * Helper method to select content between brackets
   */
  private async selectBracketContent(
    editor: vscode.TextEditor,
    bracketRange: BracketPair,
    isNextBracket: boolean
  ): Promise<void> {
    const document = editor.document;
    
    // Create a range for the content between brackets (excluding the brackets themselves)
    const contentRange = new vscode.Range(
      new vscode.Position(bracketRange.openBracketLine, bracketRange.openBracketChar + 1), // Start after the opening bracket
      new vscode.Position(bracketRange.closeBracketLine, bracketRange.closeBracketChar) // End before the closing bracket
    );
    
    // Calculate total lines in scope
    const linesInScope = bracketRange.closeBracketLine - bracketRange.openBracketLine + 1;
    
    // Get context text
    const contextText = BracketScopeUIUtils.getContextFromBracketLine(document, bracketRange.openBracketLine);
    
    // Get the text content
    const contentText = document.getText(contentRange);
    
    // Create a new selection that covers the entire content range
    editor.selection = new vscode.Selection(
      contentRange.start,
      contentRange.end
    );
    
    // Copy the content to clipboard
    await vscode.env.clipboard.writeText(contentText);
    
    // Scroll to show the highlighted area
    editor.revealRange(contentRange, vscode.TextEditorRevealType.InCenter);
    
    // Show information message
    const message = isNextBracket 
      ? `Selected next bracket scope${contextText}`
      : `Selected bracket scope${contextText}`;
      
    const detailMessage = `From line ${bracketRange.openBracketLine + 1} to ${bracketRange.closeBracketLine + 1} (${linesInScope} lines). Content copied to clipboard.`;
    
    // Show the message
    BracketScopeUIUtils.showBracketOperationMessage(message, detailMessage, isNextBracket);
  }
}
