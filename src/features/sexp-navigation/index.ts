import * as vscode from 'vscode';
import { CommandRegistry, FeatureModule } from '../../core';
import { SexpNavigationHandlers } from './handlers';
import { SexpNavigatorFactory } from './finders';

/**
 * Feature module for Emacs-like S-expression navigation
 * Provides functionality to navigate between balanced expressions
 */
export class SexpNavigationFeature extends FeatureModule {
  private handlers: SexpNavigationHandlers;

  /**
   * Create a new SexpNavigationFeature
   * @param commandRegistry The command registry service
   */
  constructor(commandRegistry: CommandRegistry) {
    super(commandRegistry, 'Sexp Navigation');
    this.handlers = new SexpNavigationHandlers();
    
    // Initialize the navigator factory
    SexpNavigatorFactory.initialize();
  }

  /**
   * Register the sexp navigation commands
   */
  register(): void {
    const forwardSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.forwardSexp',
      this.handlers.handleForwardSexp.bind(this.handlers)
    );
    
    const backwardSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.backwardSexp',
      this.handlers.handleBackwardSexp.bind(this.handlers)
    );
    
    this.addDisposable(forwardSexpDisposable);
    this.addDisposable(backwardSexpDisposable);
  }
}

// Re-export types for external usage
export * from './types';
export * from './finders';
export * from './ui-utils';
export * from './handlers';
