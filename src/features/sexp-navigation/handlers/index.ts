import * as vscode from 'vscode';
import { SexpNavigationHandlers as NavigationHandlers } from './navigation-handlers';
import { SexpSelectionHandlers } from './selection-handlers';
import { SexpTranspositionHandlers } from './transposition-handlers';

/**
 * Main handler class that aggregates all S-expression handler operations
 * Provides a unified API for all S-expression commands
 */
export class SexpHandlers {
  private navigationHandlers: NavigationHandlers;
  private selectionHandlers: SexpSelectionHandlers;
  private transpositionHandlers: SexpTranspositionHandlers;

  constructor() {
    this.navigationHandlers = new NavigationHandlers();
    this.selectionHandlers = new SexpSelectionHandlers();
    this.transpositionHandlers = new SexpTranspositionHandlers();
  }

  /**
   * Handles the forward sexp navigation command
   * @param editor The text editor
   */
  public async handleForwardSexp(editor: vscode.TextEditor): Promise<void> {
    return this.navigationHandlers.handleForwardSexp(editor);
  }

  /**
   * Handles the backward sexp navigation command
   * @param editor The text editor
   */
  public async handleBackwardSexp(editor: vscode.TextEditor): Promise<void> {
    return this.navigationHandlers.handleBackwardSexp(editor);
  }

  /**
   * Handles the mark sexp command
   * @param editor The text editor
   */
  public async handleMarkSexp(editor: vscode.TextEditor): Promise<void> {
    return this.selectionHandlers.handleMarkSexp(editor);
  }

  /**
   * Handles the mark parent sexp command
   * @param editor The text editor
   */
  public async handleMarkParentSexp(editor: vscode.TextEditor): Promise<void> {
    return this.selectionHandlers.handleMarkParentSexp(editor);
  }

  /**
   * Handles the expand sexp selection command
   * @param editor The text editor
   */
  public async handleExpandSexpSelection(editor: vscode.TextEditor): Promise<void> {
    return this.selectionHandlers.handleExpandSexpSelection(editor);
  }

  /**
   * Handles the transpose sexp command
   * @param editor The text editor
   */
  public async handleTransposeSexp(editor: vscode.TextEditor): Promise<void> {
    return this.transpositionHandlers.handleTransposeSexp(editor);
  }

  /**
   * Handles the move sexp up command
   * @param editor The text editor
   */
  public async handleMoveSexpUp(editor: vscode.TextEditor): Promise<void> {
    return this.transpositionHandlers.handleMoveSexpUp(editor);
  }

  /**
   * Handles the move sexp down command
   * @param editor The text editor
   */
  public async handleMoveSexpDown(editor: vscode.TextEditor): Promise<void> {
    return this.transpositionHandlers.handleMoveSexpDown(editor);
  }
}

// For backward compatibility with existing code
export { SexpHandlers as SexpNavigationHandlers };

// Export individual handler classes for direct usage when needed
export { NavigationHandlers, SexpSelectionHandlers, SexpTranspositionHandlers };
export { BaseSexpHandler } from './base-handler';
