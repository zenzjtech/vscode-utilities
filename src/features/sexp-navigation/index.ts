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
    // Navigation commands
    const forwardSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.forwardSexp',
      this.handlers.handleForwardSexp.bind(this.handlers)
    );
    
    const backwardSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.backwardSexp',
      this.handlers.handleBackwardSexp.bind(this.handlers)
    );
    
    // Selection commands
    const markSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.markSexp',
      this.handlers.handleMarkSexp.bind(this.handlers)
    );
    
    const markParentSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.markParentSexp',
      this.handlers.handleMarkParentSexp.bind(this.handlers)
    );
    
    const expandSexpSelectionDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.expandSexpSelection',
      this.handlers.handleExpandSexpSelection.bind(this.handlers)
    );
    
    // Transposition commands
    const transposeSexpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.transposeSexp',
      this.handlers.handleTransposeSexp.bind(this.handlers)
    );
    
    const moveSexpUpDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.moveSexpUp',
      this.handlers.handleMoveSexpUp.bind(this.handlers)
    );
    
    const moveSexpDownDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.moveSexpDown',
      this.handlers.handleMoveSexpDown.bind(this.handlers)
    );
    
    // Add all disposables
    this.addDisposable(forwardSexpDisposable);
    this.addDisposable(backwardSexpDisposable);
    this.addDisposable(markSexpDisposable);
    this.addDisposable(markParentSexpDisposable);
    this.addDisposable(expandSexpSelectionDisposable);
    this.addDisposable(transposeSexpDisposable);
    this.addDisposable(moveSexpUpDisposable);
    this.addDisposable(moveSexpDownDisposable);
  }
}

// Re-export types for external usage
export * from './types';
export * from './finders';
export * from './ui-utils';
export * from './handlers';
