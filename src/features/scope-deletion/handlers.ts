import * as vscode from 'vscode';
import { ScopeFinderFactory } from './finders';
import { ScopeInfo, ScopeType } from './types';
import { ScopeUiUtils } from './ui-utils';

/**
 * Command handlers for scope deletion features
 */
export class ScopeHandlers {
  /**
   * Handle the select scope command
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param currentScopeInfo Current scope information
   */
  public static async handleSelectScope(
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    currentScopeInfo: ScopeInfo | null
  ): Promise<void> {
    if (!editor) {
      return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    
    // Get the appropriate finder for the current language
    const scopeFinder = ScopeFinderFactory.getFinder(document.languageId);
    
    // Try to find a function, class, interface, or enum at the current position
    const containingFunction = scopeFinder.findContainingFunction(document, position);
    const containingClass = scopeFinder.findContainingClass(document, position);
    
    if (containingFunction) {
      await this.selectScope(editor, containingFunction);
    } else if (containingClass) {
      await this.selectScope(editor, containingClass);
    } else if (currentScopeInfo) {
      // If we have cached scope info, use that
      await this.selectScope(editor, currentScopeInfo);
    } else {
      ScopeUiUtils.showNoScopeFoundMessage();
    }
  }

  /**
   * Select a scope by its boundaries and copy content to clipboard
   * @param editor The active text editor
   * @param scopeInfo Information about the scope to select
   */
  private static async selectScope(
    editor: vscode.TextEditor,
    scopeInfo: ScopeInfo
  ): Promise<void> {
    const document = editor.document;
    const scopeFinder = ScopeFinderFactory.getFinder(document.languageId);
    
    const endLine = scopeFinder.findScopeBoundary(document, scopeInfo.startLine, scopeInfo.startLine);
    
    if (endLine === null) {
      ScopeUiUtils.showBoundaryNotFoundMessage(scopeInfo.scopeType);
      return;
    }
    
    // Create a range from the scope start to end
    const range = new vscode.Range(
      new vscode.Position(scopeInfo.startLine, 0),
      new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
    
    // Select the text
    editor.selection = new vscode.Selection(range.start, range.end);
    
    // Get the text content of the scope
    const scopeText = document.getText(range);
    
    // Check if we should copy to clipboard
    const configuration = vscode.workspace.getConfiguration('vscodeUtilities');
    const copyToClipboard = configuration.get<boolean>('copyToClipboard', true);
    
    // Copy to clipboard if enabled
    if (copyToClipboard) {
      await vscode.env.clipboard.writeText(scopeText);
      
      // Show a message
      const capitalizedType = scopeInfo.scopeType.charAt(0).toUpperCase() + scopeInfo.scopeType.slice(1);
      vscode.window.showInformationMessage(
        `${capitalizedType} '${scopeInfo.name}' selected and copied to clipboard`,
        { detail: `${endLine - scopeInfo.startLine + 1} lines selected` }
      );
    }
  }

  /**
   * Handle the delete scope command
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param currentScopeInfo Current scope information
   */
  public static async handleDeleteScope(
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    currentScopeInfo: ScopeInfo | null
  ): Promise<void> {
    if (!editor) {
      return;
    }

    // Check if we should highlight before deleting
    const configuration = vscode.workspace.getConfiguration('vscodeUtilities');
    const highlightBeforeDeleting = configuration.get<boolean>('highlightBeforeDeleting', true);
    
    const document = editor.document;
    const position = editor.selection.active;
    
    // Get the appropriate finder for the current language
    const scopeFinder = ScopeFinderFactory.getFinder(document.languageId);
    
    // Try to find a function, class, interface, or enum at the current position
    const containingFunction = scopeFinder.findContainingFunction(document, position);
    const containingClass = scopeFinder.findContainingClass(document, position);
    
    if (containingFunction) {
      if (highlightBeforeDeleting) {
        // Highlight the function scope and confirm
        const endLine = scopeFinder.findScopeBoundary(document, containingFunction.startLine, containingFunction.startLine);
        
        if (endLine === null) {
          ScopeUiUtils.showBoundaryNotFoundMessage(containingFunction.scopeType);
          return;
        }
        
        if (await ScopeUiUtils.highlightAndConfirmDeletion(
          editor, 
          document, 
          containingFunction.startLine, 
          endLine, 
          containingFunction.scopeType, 
          containingFunction.name
        )) {
          await this.deleteScope(editor, containingFunction);
        }
      } else {
        // Delete without highlighting
        await this.deleteScope(editor, containingFunction);
      }
    } else if (containingClass) {
      if (highlightBeforeDeleting) {
        // Highlight the class/interface/enum scope and confirm
        const endLine = scopeFinder.findScopeBoundary(document, containingClass.startLine, containingClass.startLine);
        
        if (endLine === null) {
          ScopeUiUtils.showBoundaryNotFoundMessage(containingClass.scopeType);
          return;
        }
        
        if (await ScopeUiUtils.highlightAndConfirmDeletion(
          editor, 
          document, 
          containingClass.startLine, 
          endLine, 
          containingClass.scopeType, 
          containingClass.name
        )) {
          await this.deleteScope(editor, containingClass);
        }
      } else {
        // Delete without highlighting
        await this.deleteScope(editor, containingClass);
      }
    } else if (currentScopeInfo) {
      // If we have cached scope info, use that
      if (highlightBeforeDeleting) {
        const endLine = scopeFinder.findScopeBoundary(document, currentScopeInfo.startLine, currentScopeInfo.startLine);
        
        if (endLine === null) {
          ScopeUiUtils.showBoundaryNotFoundMessage(currentScopeInfo.scopeType);
          return;
        }
        
        if (await ScopeUiUtils.highlightAndConfirmDeletion(
          editor, 
          document, 
          currentScopeInfo.startLine, 
          endLine, 
          currentScopeInfo.scopeType, 
          currentScopeInfo.name
        )) {
          await this.deleteScope(editor, currentScopeInfo);
        }
      } else {
        await this.deleteScope(editor, currentScopeInfo);
      }
    } else {
      ScopeUiUtils.showNoScopeFoundMessage();
    }
  }

  /**
   * Delete a scope by its boundaries
   * @param editor The active text editor
   * @param scopeInfo Information about the scope to delete
   */
  private static async deleteScope(
    editor: vscode.TextEditor,
    scopeInfo: ScopeInfo
  ): Promise<void> {
    const document = editor.document;
    const scopeFinder = ScopeFinderFactory.getFinder(document.languageId);
    
    const endLine = scopeFinder.findScopeBoundary(document, scopeInfo.startLine, scopeInfo.startLine);
    
    if (endLine === null) {
      ScopeUiUtils.showBoundaryNotFoundMessage(scopeInfo.scopeType);
      return;
    }
    
    // Create a range from the scope start to end
    const range = new vscode.Range(
      new vscode.Position(scopeInfo.startLine, 0),
      new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
    
    // Get the text content of the scope
    const scopeText = document.getText(range);
    
    // Check if we should copy to clipboard
    const configuration = vscode.workspace.getConfiguration('vscodeUtilities');
    const copyToClipboard = configuration.get<boolean>('copyToClipboard', true);
    
    // Copy to clipboard if enabled
    if (copyToClipboard) {
      await vscode.env.clipboard.writeText(scopeText);
    }
    
    // Calculate lines removed
    const linesRemoved = endLine - scopeInfo.startLine + 1;
    
    // Delete the scope
    await editor.edit(editBuilder => {
      editBuilder.delete(range);
    });
    
    // Show detailed message with appropriate icon
    ScopeUiUtils.showSuccessMessage(
      scopeInfo.scopeType,
      scopeInfo.name,
      linesRemoved,
      scopeInfo.startLine,
      endLine,
      copyToClipboard
    );
  }

  /**
   * Show quick actions for the current scope
   * @param currentScopeInfo Current scope information
   */
  public static async showScopeActions(currentScopeInfo: ScopeInfo | null): Promise<void> {
    if (!currentScopeInfo) {
      ScopeUiUtils.showNoScopeFoundMessage();
      return;
    }
    
    const capitalizedType = currentScopeInfo.scopeType.charAt(0).toUpperCase() + currentScopeInfo.scopeType.slice(1);
    const items = [
      { label: `Select ${capitalizedType}`, description: currentScopeInfo.name, command: 'extension.selectCurrentScope' },
      { label: `Delete ${capitalizedType}`, description: currentScopeInfo.name, command: 'extension.deleteCurrentScope' }
    ];
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `${capitalizedType} '${currentScopeInfo.name}' at line ${currentScopeInfo.startLine + 1}`
    });
    
    if (selected) {
      await vscode.commands.executeCommand(selected.command);
    }
  }
}
