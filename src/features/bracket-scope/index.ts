import * as vscode from 'vscode';
import { CommandRegistry, FeatureModule } from '../../core';
import { BracketScopeHandlers } from './handlers';

/**
 * Feature module for bracket scope operations
 * Provides functionality to delete the content between bracket pairs
 */
export class BracketScopeFeature extends FeatureModule {
  private handlers: BracketScopeHandlers;

  /**
   * Create a new BracketScopeFeature
   * @param commandRegistry The command registry service
   */
  constructor(commandRegistry: CommandRegistry) {
    super(commandRegistry, 'Bracket Scope');
    this.handlers = new BracketScopeHandlers();
  }

  /**
   * Register the bracket scope commands
   */
  register(): void {
    const disposable = this.commandRegistry.registerTextEditorCommand(
      'extension.deleteCurrentBracketScope',
      this.handlers.handleDeleteBracketScope.bind(this.handlers)
    );
    
    const selectDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.selectCurrentBracketScope',
      this.handlers.handleSelectBracketScope.bind(this.handlers)
    );
    
    this.addDisposable(disposable);
    this.addDisposable(selectDisposable);
  }
}

// Re-export types for external usage
export * from './types';
export * from './finders';
export * from './ui-utils';
export * from './handlers';
