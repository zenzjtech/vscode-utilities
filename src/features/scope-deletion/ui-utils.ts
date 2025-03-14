import * as vscode from 'vscode';
import { ScopeType } from './types';

/**
 * UI utilities for the scope-deletion feature
 */
export class ScopeUiUtils {
  /**
   * Shows a success message with the appropriate icon based on scope type
   * @param scopeType The type of scope
   * @param scopeName The name of the scope
   * @param linesRemoved Number of lines removed
   * @param startLine Starting line number
   * @param endLine Ending line number
   * @param copyToClipboard Whether content was copied to clipboard
   */
  public static showSuccessMessage(
    scopeType: ScopeType,
    scopeName: string,
    linesRemoved: number,
    startLine: number,
    endLine: number,
    copyToClipboard: boolean
  ): void {
    // Create the message
    const message = `${this.capitalizeFirstLetter(scopeType)} '${scopeName}' deleted successfully!`;
    let detailMessage = `Deleted ${linesRemoved} lines (from line ${startLine + 1} to line ${endLine + 1})`;
    
    // Add clipboard info to the message if enabled
    if (copyToClipboard) {
      detailMessage += ". Content copied to clipboard.";
    }
    
    // Use different message types based on the scope type to get different icons
    if (scopeType === 'function') {
      vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
    } else if (scopeType === 'class') {
      // Using warning message type just to get a different icon
      vscode.window.showWarningMessage(message, { detail: detailMessage, modal: false });
    } else {
      vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
    }
  }

  /**
   * Highlights a scope and asks for confirmation to delete it
   * @param editor The active text editor
   * @param document The text document
   * @param startLine The start line of the scope
   * @param endLine The end line of the scope
   * @param scopeType The type of scope
   * @param scopeName The name of the scope
   * @returns True if the user confirms deletion, false otherwise
   */
  public static async highlightAndConfirmDeletion(
    editor: vscode.TextEditor,
    document: vscode.TextDocument,
    startLine: number,
    endLine: number,
    scopeType: ScopeType,
    scopeName: string
  ): Promise<boolean> {
    // Calculate lines that will be removed
    const linesRemoved = endLine - startLine + 1;
    
    // Create a range for highlighting
    const highlightRange = new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
    
    // Store the original selections
    const originalSelections = [...editor.selections];
    
    // Create a new selection that covers the entire scope
    editor.selection = new vscode.Selection(
      highlightRange.start,
      highlightRange.end
    );
    
    // Create a decoration type for the highlighting
    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
      border: '1px solid',
      borderColor: new vscode.ThemeColor('editor.selectionHighlightBorder')
    });
    
    // Apply the decoration
    editor.setDecorations(decorationType, [highlightRange]);
    
    // Scroll to show the highlighted area
    editor.revealRange(highlightRange, vscode.TextEditorRevealType.InCenter);
    
    // Ask for confirmation
    const result = await vscode.window.showWarningMessage(
      `Delete ${scopeType} '${scopeName}'?`,
      { detail: `This will remove ${linesRemoved} lines of code (from line ${startLine + 1} to ${endLine + 1})`, modal: false },
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

  /**
   * Shows a message when no scope is found at the current position
   */
  public static showNoScopeFoundMessage(): void {
    vscode.window.showInformationMessage("Cursor is not within a function or class scope.");
  }

  /**
   * Shows a message when scope boundaries cannot be determined
   * @param scopeType The type of scope
   */
  public static showBoundaryNotFoundMessage(scopeType: ScopeType): void {
    vscode.window.showErrorMessage(`Couldn't determine ${scopeType} boundaries.`);
  }

  /**
   * Creates and updates the status bar item with scope information
   * @param statusBarItem The status bar item to update
   * @param scopeInfo The scope information to display
   */
  public static updateStatusBar(
    statusBarItem: vscode.StatusBarItem,
    scopeInfo: { scopeType: string; name: string; startLine: number } | null
  ): void {
    if (scopeInfo) {
      statusBarItem.text = `$(symbol-${scopeInfo.scopeType}) ${scopeInfo.name}`;
      statusBarItem.tooltip = `Line ${scopeInfo.startLine + 1}: ${this.capitalizeFirstLetter(scopeInfo.scopeType)} ${scopeInfo.name}`;
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  }

  /**
   * Helper method to capitalize the first letter of a string
   * @param str The string to capitalize
   * @returns The capitalized string
   */
  private static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
