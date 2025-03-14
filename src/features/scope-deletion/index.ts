import * as vscode from 'vscode';
import { CommandRegistry, FeatureModule } from '../../core';
import { ScopeHandlers } from './handlers';
import { ScopeFinderFactory } from './finders';
import { ScopeUiUtils } from './ui-utils';
import { ScopeInfo } from './types';

/**
 * Feature module for deleting code scopes (functions, methods, and classes)
 */
export class ScopeDeletionFeature extends FeatureModule {
  private statusBarItem: vscode.StatusBarItem;
  private currentScopeInfo: ScopeInfo | null = null;
  private selectionChangeDisposable: vscode.Disposable | null = null;
  private _selectionChangeTimeout: NodeJS.Timeout | null = null;

  /**
   * Create a new ScopeDeletionFeature
   * @param commandRegistry The command registry service
   */
  constructor(commandRegistry: CommandRegistry) {
    super(commandRegistry, 'Scope Deletion');
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'extension.showScopeActions';
    
    // Initialize the scope finder factory
    ScopeFinderFactory.initialize();
  }

  /**
   * Register the scope deletion command
   */
  register(): void {
    const deleteDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.deleteCurrentScope',
      (editor, edit) => ScopeHandlers.handleDeleteScope(editor, edit, this.currentScopeInfo)
    );
    
    const selectDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.selectCurrentScope',
      (editor, edit) => ScopeHandlers.handleSelectScope(editor, edit, this.currentScopeInfo)
    );

    const scopeActionsDisposable = this.commandRegistry.register(
      'extension.showScopeActions',
      () => ScopeHandlers.showScopeActions(this.currentScopeInfo)
    );
    
    this.addDisposable(deleteDisposable);
    this.addDisposable(selectDisposable);
    this.addDisposable(scopeActionsDisposable);
    this.addDisposable(this.statusBarItem);
  }

  /**
   * Activate the feature
   */
  activate(): void {
    // Start listening to selection changes when activated
    this.startListeningToSelectionChanges();
    
    // Show the status bar item
    this.statusBarItem.show();
    
    super.activate();
  }

  /**
   * Deactivate the feature
   */
  deactivate(): void {
    // Stop listening to selection changes when deactivated
    this.stopListeningToSelectionChanges();
    
    // Hide the status bar item
    this.statusBarItem.hide();
    
    super.deactivate();
  }

  /**
   * Start listening to editor selection changes to update the status bar
   */
  private startListeningToSelectionChanges(): void {
    if (!this.selectionChangeDisposable) {
      this.selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(
        this.onSelectionChange.bind(this)
      );
      
      // Also register to active editor changes
      this.addDisposable(
        vscode.window.onDidChangeActiveTextEditor(
          this.onActiveEditorChange.bind(this)
        )
      );
      
      // Update status bar for current editor
      this.updateStatusBar();
    }
  }

  /**
   * Stop listening to editor selection changes
   */
  private stopListeningToSelectionChanges(): void {
    if (this.selectionChangeDisposable) {
      this.selectionChangeDisposable.dispose();
      this.selectionChangeDisposable = null;
    }
  }

  /**
   * Handle selection change events
   */
  private onSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
    // Avoid unnecessary updates by using a debounce mechanism
    if (this._selectionChangeTimeout) {
      clearTimeout(this._selectionChangeTimeout);
    }
    this._selectionChangeTimeout = setTimeout(() => {
      this.updateStatusBar();
    }, 100); // 100ms debounce
  }

  /**
   * Handle active editor change events
   */
  private onActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    this.updateStatusBar();
  }

  /**
   * Update the status bar with the current scope information
   */
  private async updateStatusBar(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.statusBarItem.hide();
      this.currentScopeInfo = null;
      return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    
    // Get the appropriate finder for the current language
    const scopeFinder = ScopeFinderFactory.getFinder(document.languageId);
    
    // First try to find if cursor is inside a function
    const containingFunction = scopeFinder.findContainingFunction(document, position);
    if (containingFunction) {
      this.currentScopeInfo = containingFunction;
      
      // Update status bar with function info
      ScopeUiUtils.updateStatusBar(this.statusBarItem, {
        scopeType: 'function',
        name: containingFunction.name,
        startLine: containingFunction.startLine
      });
      return;
    }
    
    // Then check if cursor is inside a class, interface, or enum
    const containingClass = scopeFinder.findContainingClass(document, position);
    if (containingClass) {
      this.currentScopeInfo = containingClass;
      
      // Update status bar with class info
      ScopeUiUtils.updateStatusBar(this.statusBarItem, {
        scopeType: containingClass.scopeType,
        name: containingClass.name,
        startLine: containingClass.startLine
      });
      return;
    }
    
    // No scope found
    this.statusBarItem.hide();
    this.currentScopeInfo = null;
  }
}

// Re-export types and utilities for external use
export * from './types';
export * from './finders';
export * from './handlers';
export * from './ui-utils';
