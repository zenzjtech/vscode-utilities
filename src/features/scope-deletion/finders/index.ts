import * as vscode from 'vscode';
import { ScopeFinder } from '../types';
import { TypeScriptScopeFinder } from './typescript-finder';

/**
 * Factory class for managing language-specific scope finders
 */
export class ScopeFinderFactory {
  private static finders: Map<string, ScopeFinder> = new Map();
  private static defaultFinder: ScopeFinder = new TypeScriptScopeFinder();

  /**
   * Register a scope finder for a specific language
   * @param finder The scope finder to register
   */
  public static registerFinder(finder: ScopeFinder): void {
    this.finders.set(finder.languageId, finder);
  }

  /**
   * Get a scope finder for a specific language
   * @param languageId The language ID to get a finder for
   * @returns A scope finder for the specified language or the default finder if none is registered
   */
  public static getFinder(languageId: string): ScopeFinder {
    return this.finders.get(languageId) || this.defaultFinder;
  }

  /**
   * Initialize the factory with default finders
   */
  public static initialize(): void {
    // Register the default TypeScript finder for several languages
    const tsOrJsFinder = new TypeScriptScopeFinder();
    
    this.registerFinder(tsOrJsFinder);
    
    // Also register for JavaScript, JSX, and TSX
    this.finders.set('javascript', tsOrJsFinder);
    this.finders.set('javascriptreact', tsOrJsFinder);
    this.finders.set('typescriptreact', tsOrJsFinder);
  }
}
