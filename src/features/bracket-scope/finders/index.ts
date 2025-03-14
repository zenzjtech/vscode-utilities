import * as vscode from 'vscode';
import { BracketFinder } from '../types';
import { CurlyBracketFinder } from './curly-bracket-finder';

/**
 * Factory class for creating and managing language-specific bracket finders
 */
export class BracketFinderFactory {
  private finders: BracketFinder[] = [];
  
  constructor() {
    // Register default finders
    this.registerFinder(new CurlyBracketFinder());
    
    // Additional finders for other languages can be registered here
    // For example: 
    // this.registerFinder(new PythonBracketFinder());
    // this.registerFinder(new XMLBracketFinder());
  }
  
  /**
   * Register a new bracket finder
   * @param finder The bracket finder to register
   */
  public registerFinder(finder: BracketFinder): void {
    this.finders.push(finder);
  }
  
  /**
   * Get the appropriate bracket finder for a document
   * @param document The text document
   * @returns The appropriate bracket finder, or the default finder if no specific one is found
   */
  public getFinderForDocument(document: vscode.TextDocument): BracketFinder {
    const languageId = document.languageId;
    
    // Find a finder specifically for this language
    const specificFinder = this.finders.find(finder => 
      finder.languageId !== '*' && finder.languageId === languageId
    );
    
    if (specificFinder) {
      return specificFinder;
    }
    
    // If no specific finder is found, return a default finder
    return this.finders.find(finder => finder.languageId === '*') || new CurlyBracketFinder();
  }
}
