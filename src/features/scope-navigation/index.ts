import * as vscode from 'vscode';
import { CommandRegistry, FeatureModule } from '../../core';
import { ScopeNavigationHandlers } from './handlers';

/**
 * Feature module for navigating between code scopes (functions and classes)
 */
export class ScopeNavigationFeature extends FeatureModule {
  private handlers: ScopeNavigationHandlers;

  /**
   * Create a new ScopeNavigationFeature
   * @param commandRegistry The command registry service
   */
  constructor(commandRegistry: CommandRegistry) {
    super(commandRegistry, 'Scope Navigation');
    this.handlers = new ScopeNavigationHandlers();
  }

  /**
   * Register the scope navigation commands
   */
  register(): void {
    // Function navigation commands
    const nextFunctionDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.nextFunction',
      this.handlers.handleNextFunction.bind(this.handlers)
    );
    
    const previousFunctionDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.previousFunction',
      this.handlers.handlePreviousFunction.bind(this.handlers)
    );
    
    // Class navigation commands
    const nextClassDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.nextClass',
      this.handlers.handleNextClass.bind(this.handlers)
    );
    
    const previousClassDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.previousClass',
      this.handlers.handlePreviousClass.bind(this.handlers)
    );

    // General scope navigation commands (navigate to either function or class)
    const nextScopeDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.nextScope',
      this.handlers.handleNextScope.bind(this.handlers)
    );
    
    const previousScopeDisposable = this.commandRegistry.registerTextEditorCommand(
      'extension.previousScope',
      this.handlers.handlePreviousScope.bind(this.handlers)
    );
    
    // Add all disposables
    this.addDisposable(nextFunctionDisposable);
    this.addDisposable(previousFunctionDisposable);
    this.addDisposable(nextClassDisposable);
    this.addDisposable(previousClassDisposable);
    this.addDisposable(nextScopeDisposable);
    this.addDisposable(previousScopeDisposable);
  }
}

// Re-export types for external usage
export * from './types';
export * from './handlers';
