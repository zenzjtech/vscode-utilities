import * as vscode from 'vscode';
import { SexpBoundary } from './types';

/**
 * UI utilities for sexp navigation
 */
export class SexpNavigationUiUtils {
  
  /**
   * Shows a status bar message indicating the type of sexp navigation
   * @param direction The direction of navigation ('forward' or 'backward')
   */
  public static showNavigationMessage(direction: 'forward' | 'backward'): void {
    const actionMessage = direction === 'forward' ? 'Forward' : 'Backward';
    vscode.window.setStatusBarMessage(`${actionMessage} S-expression`, 2000);
  }
  
  /**
   * Creates a decoration type for briefly highlighting the target sexp
   * @returns A text editor decoration type
   */
  public static getHighlightDecoration(): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
      borderRadius: '3px',
      border: '1px solid',
      borderColor: new vscode.ThemeColor('editor.findMatchHighlightBorder'),
    });
  }
  
  /**
   * Briefly highlights the target sexp to provide visual feedback
   * @param editor The text editor
   * @param boundary The boundary of the sexp to highlight
   */
  public static highlightSexp(
    editor: vscode.TextEditor,
    boundary: SexpBoundary
  ): void {
    const decoration = this.getHighlightDecoration();
    const range = new vscode.Range(
      boundary.startLine,
      boundary.startChar,
      boundary.endLine,
      boundary.endChar
    );
    
    editor.setDecorations(decoration, [range]);
    
    // Remove the decoration after a short delay
    setTimeout(() => {
      decoration.dispose();
    }, 300);
  }
}
