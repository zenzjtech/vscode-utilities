import * as vscode from 'vscode';
import { SexpNavigatorFactory } from '../finders';
import { SexpNavigationUiUtils } from '../ui-utils';
import { SexpBoundary } from '../types';
import { BaseSexpHandler } from './base-handler';

/**
 * Handlers for S-expression selection commands
 */
export class SexpSelectionHandlers extends BaseSexpHandler {
  /**
   * Handles the mark sexp command
   * Selects the current or next balanced expression
   * @param editor The text editor
   */
  public async handleMarkSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the boundary of the current or next expression
    const sexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (sexpBoundary) {
      this.selectSexpression(editor, sexpBoundary, 'mark', position);
    }
  }

  /**
   * Handles the mark parent sexp command
   * Finds and selects the parent balanced expression that contains the cursor
   * @param editor The text editor
   */
  public async handleMarkParentSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the parent expression that contains the current position
    const parentSexpBoundary = this.findParentSexpression(editor.document, position, navigator);
    
    if (parentSexpBoundary) {
      this.selectSexpression(editor, parentSexpBoundary, 'mark-parent', position);
    }
  }

  /**
   * Handles the expand sexp selection command
   * Expands the current selection to include the parent expression
   * @param editor The text editor
   */
  public async handleExpandSexpSelection(editor: vscode.TextEditor): Promise<void> {
    const selection = editor.selection;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // If there's already a selection, try to find a parent that fully contains it
    const startPos = selection.start;
    const endPos = selection.end;
    
    // Create a boundary representing the current selection
    const currentSelectionBoundary: SexpBoundary = {
      startLine: startPos.line,
      startChar: startPos.character,
      endLine: endPos.line,
      endChar: endPos.character
    };
    
    // Find a parent expression that fully contains the current selection
    const parentSexpBoundary = this.findParentSexpression(
      editor.document, 
      startPos, 
      navigator, 
      currentSelectionBoundary
    );
    
    if (parentSexpBoundary) {
      this.selectSexpression(editor, parentSexpBoundary, 'expand', startPos);
    }
  }

  /**
   * Selects an S-expression and provides visual feedback
   * @param editor The text editor
   * @param boundary The boundary of the expression to select
   * @param action The type of action being performed ('mark', 'mark-parent', or 'expand')
   * @param originalPosition The original cursor position
   */
  private selectSexpression(
    editor: vscode.TextEditor,
    boundary: SexpBoundary,
    action: 'mark' | 'mark-parent' | 'expand',
    originalPosition: vscode.Position
  ): void {
    // Create a range for the S-expression
    const range = new vscode.Range(
      boundary.startLine,
      boundary.startChar,
      boundary.endLine,
      boundary.endChar
    );
    
    // Update the selection
    editor.selection = new vscode.Selection(
      boundary.startLine,
      boundary.startChar,
      boundary.endLine,
      boundary.endChar
    );
    
    // Ensure the selection is visible
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    
    // Get the text of the expression for display and clipboard
    const selectedText = editor.document.getText(range);
    
    // Check if we should automatically copy to clipboard
    const config = vscode.workspace.getConfiguration('vscodeUtilities');
    if (config.get<boolean>('copyToClipboard')) {
      vscode.env.clipboard.writeText(selectedText);
    }
    
    // Provide visual feedback
    SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
      editor,
      boundary,
      action === 'mark' ? 'forward' : 'backward', // Use direction for appropriate styling
      originalPosition
    );
    
    // Show a notification with the action type
    let message = '';
    switch (action) {
      case 'mark':
        message = 'Selected S-expression';
        break;
      case 'mark-parent':
        message = 'Selected parent S-expression';
        break;
      case 'expand':
        message = 'Expanded selection to parent S-expression';
        break;
    }
    
    // Determine the size of the selection for the message
    const lineCount = boundary.endLine - boundary.startLine + 1;
    const charCount = selectedText.length;
    
    // Show a detailed message with copy confirmation if appropriate
    if (config.get<boolean>('copyToClipboard')) {
      vscode.window.setStatusBarMessage(
        `${message} (${lineCount} lines, ${charCount} chars) - Copied to clipboard`, 
        3000
      );
    } else {
      vscode.window.setStatusBarMessage(
        `${message} (${lineCount} lines, ${charCount} chars)`, 
        3000
      );
    }
  }
}
