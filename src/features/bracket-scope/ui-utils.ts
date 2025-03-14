import * as vscode from 'vscode';

/**
 * UI utility functions for the bracket scope feature
 */
export class BracketScopeUIUtils {
  /**
   * Highlight the bracket content that will be deleted and ask for confirmation
   * @param editor The active text editor
   * @param contentRange Range of content to highlight and potentially delete
   * @param contextDescription Description of what will be deleted
   * @param linesRemoved Number of lines affected
   * @returns True if the user confirms deletion, false otherwise
   */
  public static async highlightAndConfirmBracketDeletion(
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

  /**
   * Extract context information from the line containing a bracket
   * @param document The text document
   * @param bracketLine The line number of the bracket
   * @returns Context description or empty string if no context is found
   */
  public static getContextFromBracketLine(
    document: vscode.TextDocument,
    bracketLine: number
  ): string {
    try {
      // Try to extract some context from the surrounding code
      const lineText = document.lineAt(bracketLine).text.trim();
      const contextMatch = lineText.match(/(\w+)\s*{/);
      if (contextMatch && contextMatch.length > 1) {
        return ` in '${contextMatch[1]}'`;
      }
    } catch (e) {
      // Ignore any errors in getting context
    }
    return "";
  }

  /**
   * Show an information message about a bracket operation
   * @param message The main message to show
   * @param detailMessage Additional details to show
   * @param isWarning Whether to show the message as a warning
   */
  public static showBracketOperationMessage(
    message: string,
    detailMessage: string,
    isWarning: boolean = false
  ): void {
    if (isWarning) {
      vscode.window.showWarningMessage(message, { detail: detailMessage, modal: false });
    } else {
      vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
    }
  }
}
