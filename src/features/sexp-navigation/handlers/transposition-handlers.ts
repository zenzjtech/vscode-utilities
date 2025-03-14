import * as vscode from 'vscode';
import { SexpNavigatorFactory } from '../finders';
import { SexpNavigationUiUtils } from '../ui-utils';
import { SexpBoundary } from '../types';
import { BaseSexpHandler } from './base-handler';

/**
 * Handlers for S-expression transposition commands
 */
export class SexpTranspositionHandlers extends BaseSexpHandler {
  /**
   * Handles the transpose sexp command
   * Swaps the current S-expression with the next one
   * @param editor The text editor
   */
  public async handleTransposeSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the boundary of the current expression
    const currentSexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (!currentSexpBoundary) {
      vscode.window.showWarningMessage('No S-expression found at the current position');
      return;
    }
    
    // Find the boundary of the next expression
    const nextPosition = new vscode.Position(currentSexpBoundary.endLine, currentSexpBoundary.endChar);
    const nextSexpBoundary = navigator.findForwardSexp(editor.document, nextPosition);
    
    if (!nextSexpBoundary) {
      vscode.window.showWarningMessage('No next S-expression found to transpose with');
      return;
    }
    
    // Perform the transposition
    await this.transposeSexpressions(editor, currentSexpBoundary, nextSexpBoundary);
  }

  /**
   * Handles the move sexp up command
   * Moves the current S-expression up in a list (swapping with the previous sibling)
   * @param editor The text editor
   */
  public async handleMoveSexpUp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the nearest list context (parent expression that's a list)
    const parentBoundary = this.findParentSexpression(editor.document, position, navigator);
    
    if (!parentBoundary) {
      vscode.window.showWarningMessage('Could not find a parent expression to move within');
      return;
    }
    
    // Find the current expression
    const currentSexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (!currentSexpBoundary) {
      vscode.window.showWarningMessage('No S-expression found at the current position');
      return;
    }
    
    // Find the previous sibling expression
    const previousSibling = this.findPreviousSibling(
      editor.document, 
      currentSexpBoundary, 
      parentBoundary, 
      navigator
    );
    
    if (!previousSibling) {
      vscode.window.showWarningMessage('No previous S-expression found to move before');
      return;
    }
    
    // Perform the transposition with the previous sibling
    await this.transposeSexpressions(editor, previousSibling, currentSexpBoundary);
  }

  /**
   * Handles the move sexp down command
   * Moves the current S-expression down in a list (swapping with the next sibling)
   * @param editor The text editor
   */
  public async handleMoveSexpDown(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the current expression
    const currentSexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (!currentSexpBoundary) {
      vscode.window.showWarningMessage('No S-expression found at the current position');
      return;
    }
    
    // Find the next sibling expression
    const nextPosition = new vscode.Position(currentSexpBoundary.endLine, currentSexpBoundary.endChar);
    const nextSibling = navigator.findForwardSexp(editor.document, nextPosition);
    
    if (!nextSibling) {
      vscode.window.showWarningMessage('No next S-expression found to move after');
      return;
    }
    
    // Perform the transposition with the next sibling
    await this.transposeSexpressions(editor, currentSexpBoundary, nextSibling);
  }

  /**
   * Transposes two S-expressions by swapping their text content
   * @param editor The text editor
   * @param firstBoundary The boundary of the first expression
   * @param secondBoundary The boundary of the second expression
   */
  private async transposeSexpressions(
    editor: vscode.TextEditor,
    firstBoundary: SexpBoundary, 
    secondBoundary: SexpBoundary
  ): Promise<void> {
    // Create ranges for both expressions
    const firstRange = new vscode.Range(
      firstBoundary.startLine, 
      firstBoundary.startChar,
      firstBoundary.endLine,
      firstBoundary.endChar
    );
    
    const secondRange = new vscode.Range(
      secondBoundary.startLine,
      secondBoundary.startChar,
      secondBoundary.endLine,
      secondBoundary.endChar
    );
    
    // Get the text of both expressions
    const firstText = editor.document.getText(firstRange);
    const secondText = editor.document.getText(secondRange);
    
    // Check if there's whitespace between expressions that should be preserved
    const spaceBetween = this.getSpaceBetween(editor.document, firstBoundary, secondBoundary);
    
    // Provide visual feedback before the transposition
    SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
      editor,
      firstBoundary,
      'forward',
      new vscode.Position(firstBoundary.startLine, firstBoundary.startChar)
    );
    
    SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
      editor,
      secondBoundary,
      'backward',
      new vscode.Position(secondBoundary.startLine, secondBoundary.startChar)
    );
    
    // Perform the swap in a single edit
    await editor.edit(editBuilder => {
      // If the expressions are adjacent with no whitespace between them
      if (!spaceBetween) {
        editBuilder.replace(firstRange, secondText);
        editBuilder.replace(secondRange, firstText);
      } else {
        // We need to handle the case where there's whitespace between expressions
        // Create a range that includes both expressions and the space between
        const combinedRange = new vscode.Range(
          firstBoundary.startLine,
          firstBoundary.startChar,
          secondBoundary.endLine,
          secondBoundary.endChar
        );
        
        // Replace with the transposed text
        editBuilder.replace(combinedRange, secondText + spaceBetween + firstText);
      }
    });
    
    // Adjust cursor position to the start of the second expression (now in first position)
    const newPosition = new vscode.Position(firstBoundary.startLine, firstBoundary.startChar);
    editor.selection = new vscode.Selection(newPosition, newPosition);
    
    // Ensure the edited text is visible
    editor.revealRange(
      new vscode.Range(firstBoundary.startLine, firstBoundary.startChar, secondBoundary.endLine, secondBoundary.endChar),
      vscode.TextEditorRevealType.Default
    );
    
    // Provide a status message
    vscode.window.setStatusBarMessage('Transposed S-expressions', 2000);
  }

  /**
   * Finds the previous sibling expression within the same parent
   * @param document The text document
   * @param currentBoundary The current expression boundary
   * @param parentBoundary The parent expression boundary
   * @param navigator The S-expression navigator
   * @returns The boundary of the previous sibling, or undefined if none found
   */
  private findPreviousSibling(
    document: vscode.TextDocument,
    currentBoundary: SexpBoundary,
    parentBoundary: SexpBoundary,
    navigator: any
  ): SexpBoundary | undefined {
    // Start from the parent's beginning and search forward for siblings
    let position = new vscode.Position(parentBoundary.startLine, parentBoundary.startChar);
    let sibling = navigator.findForwardSexp(document, position);
    let previousSibling: SexpBoundary | undefined = undefined;
    
    // Keep finding siblings until we reach the current one
    while (sibling && 
           !this.isSameBoundary(sibling, currentBoundary) && 
           this.boundaryContainsPosition(parentBoundary, new vscode.Position(sibling.endLine, sibling.endChar))) {
      previousSibling = sibling;
      position = new vscode.Position(sibling.endLine, sibling.endChar);
      sibling = navigator.findForwardSexp(document, position);
    }
    
    // If we found the current one, return the previous sibling (if any)
    if (sibling && this.isSameBoundary(sibling, currentBoundary)) {
      return previousSibling;
    }
    
    return undefined;
  }
}
