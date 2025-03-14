import * as vscode from 'vscode';
import { SexpNavigator } from '../types';
import { TypeScriptSexpNavigator } from './typescript-navigator';

/**
 * Factory class for managing language-specific sexp navigators
 */
export class SexpNavigatorFactory {
  private static navigators: Map<string, SexpNavigator> = new Map();
  private static initialized: boolean = false;
  private static genericNavigator: SexpNavigator;

  /**
   * Initialize the factory with supported navigators
   */
  public static initialize(): void {
    if (this.initialized) {
      return;
    }

    // Register language-specific navigators
    const typescriptNavigator = new TypeScriptSexpNavigator();
    this.registerNavigator(typescriptNavigator);
    
    // Use TypeScript navigator as generic fallback for JavaScript
    const javascriptNavigator = new TypeScriptSexpNavigator();
    Object.defineProperty(javascriptNavigator, 'languageId', { value: 'javascript' });
    this.registerNavigator(javascriptNavigator);

    // Set the TypeScript navigator as the generic fallback for unsupported languages
    this.genericNavigator = typescriptNavigator;
    
    this.initialized = true;
  }

  /**
   * Register a new navigator
   * @param navigator The navigator to register
   */
  public static registerNavigator(navigator: SexpNavigator): void {
    this.navigators.set(navigator.languageId, navigator);
  }

  /**
   * Get the appropriate navigator for a language
   * @param languageId The language ID
   * @returns The navigator for the language or a generic fallback
   */
  public static getNavigator(languageId: string): SexpNavigator {
    if (!this.initialized) {
      this.initialize();
    }

    return this.navigators.get(languageId) || this.genericNavigator;
  }

  /**
   * Get the appropriate navigator for the active editor
   * @returns The navigator for the active editor's language or a generic fallback
   */
  public static getNavigatorForActiveEditor(): SexpNavigator {
    if (!this.initialized) {
      this.initialize();
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return this.genericNavigator;
    }

    return this.getNavigator(editor.document.languageId);
  }
}
