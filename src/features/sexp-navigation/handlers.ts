import * as vscode from 'vscode';
import { SexpNavigatorFactory } from './finders';
import { SexpNavigationUiUtils } from './ui-utils';

/**
 * Handlers for sexp navigation commands
 */
export class SexpNavigationHandlers {
  
  /**
   * Handles the forward sexp navigation command
   * Moves the cursor to the end of the next balanced expression
   * @param editor The text editor
   */
  public async handleForwardSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    const sexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (sexpBoundary) {
      // Use enhanced visual feedback
      SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
        editor,
        sexpBoundary,
        'forward',
        position
      );
      
      // Move the cursor to the end position of the expression
      const newPosition = new vscode.Position(sexpBoundary.endLine, sexpBoundary.endChar);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      
      // Ensure the new position is visible
      editor.revealRange(
        new vscode.Range(newPosition, newPosition),
        vscode.TextEditorRevealType.Default
      );
    }
  }
  
  /**
   * Handles the backward sexp navigation command
   * Moves the cursor to the beginning of the previous balanced expression
   * @param editor The text editor
   */
  public async handleBackwardSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    const sexpBoundary = navigator.findBackwardSexp(editor.document, position);
    
    if (sexpBoundary) {
      // Use enhanced visual feedback
      SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
        editor,
        sexpBoundary,
        'backward',
        position
      );
      
      // Move the cursor to the start position of the expression
      const newPosition = new vscode.Position(sexpBoundary.startLine, sexpBoundary.startChar);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      
      // Ensure the new position is visible
      editor.revealRange(
        new vscode.Range(newPosition, newPosition),
        vscode.TextEditorRevealType.Default
      );
    }
  }
}
