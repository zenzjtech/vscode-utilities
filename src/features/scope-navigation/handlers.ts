import * as vscode from 'vscode';
import { ScopeFinderFactory } from '../scope-deletion/finders';
import { ScopeInfo } from '../scope-deletion/types';
import { NavigationDirection, ScopeNavigationResult } from './types';

/**
 * Handlers for scope navigation features
 */
export class ScopeNavigationHandlers {
  /**
   * Navigate to the next function or class declaration
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  public async handleNextFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const result = await this.navigateToScope(editor, NavigationDirection.Forward, 'function');
    this.handleNavigationResult(editor, result);
  }

  /**
   * Navigate to the previous function or class declaration
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  public async handlePreviousFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const result = await this.navigateToScope(editor, NavigationDirection.Backward, 'function');
    this.handleNavigationResult(editor, result);
  }

  /**
   * Navigate to the next class declaration
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  public async handleNextClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const result = await this.navigateToScope(editor, NavigationDirection.Forward, 'class');
    this.handleNavigationResult(editor, result);
  }

  /**
   * Navigate to the previous class declaration
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  public async handlePreviousClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const result = await this.navigateToScope(editor, NavigationDirection.Backward, 'class');
    this.handleNavigationResult(editor, result);
  }

  /**
   * Navigate to the next function or class declaration
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  public async handleNextScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const result = await this.navigateToScope(editor, NavigationDirection.Forward, 'any');
    this.handleNavigationResult(editor, result);
  }

  /**
   * Navigate to the previous function or class declaration
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  public async handlePreviousScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const result = await this.navigateToScope(editor, NavigationDirection.Backward, 'any');
    this.handleNavigationResult(editor, result);
  }

  /**
   * Handle the navigation result
   * @param editor The active text editor
   * @param result The navigation result
   */
  private handleNavigationResult(editor: vscode.TextEditor, result: ScopeNavigationResult): void {
    if (result.success && result.targetPosition) {
      // Move cursor to the target position
      editor.selection = new vscode.Selection(result.targetPosition, result.targetPosition);
      
      // Reveal the target position in editor
      editor.revealRange(
        new vscode.Range(result.targetPosition, result.targetPosition),
        vscode.TextEditorRevealType.InCenter
      );
      
      // Show success message if provided
      if (result.message) {
        vscode.window.setStatusBarMessage(result.message, 2000);
      }
    } else {
      // Show error message if navigation failed
      if (result.message) {
        vscode.window.showInformationMessage(result.message);
      }
    }
  }

  /**
   * Navigate to the next or previous scope (function or class)
   * @param editor The active text editor
   * @param direction Direction to navigate (forward or backward)
   * @param scopeType Type of scope to navigate to (function, class, or any)
   * @returns The navigation result
   */
  private async navigateToScope(
    editor: vscode.TextEditor,
    direction: NavigationDirection,
    scopeType: 'function' | 'class' | 'any'
  ): Promise<ScopeNavigationResult> {
    const document = editor.document;
    const position = editor.selection.active;
    const languageId = document.languageId;
    
    // Get the appropriate finder for the current language
    const scopeFinder = ScopeFinderFactory.getFinder(languageId);
    
    // Find all functions and classes in the document
    const scopes: ScopeInfo[] = [];
    
    // Find relevant scopes based on the requested scope type
    if (scopeType === 'function' || scopeType === 'any') {
      const allFunctions = await this.findAllFunctions(document, scopeFinder);
      scopes.push(...allFunctions);
    }
    
    if (scopeType === 'class' || scopeType === 'any') {
      const allClasses = await this.findAllClasses(document, scopeFinder);
      scopes.push(...allClasses);
    }
    
    // Sort scopes by line number
    scopes.sort((a, b) => a.startLine - b.startLine);
    
    // Return error if no scopes found
    if (scopes.length === 0) {
      return {
        success: false,
        message: `No ${scopeType !== 'any' ? scopeType + ' ' : ''}scope declarations found in document.`
      };
    }
    
    // Find the current or next/previous scope based on direction
    if (direction === NavigationDirection.Forward) {
      // Find the first scope that starts after the current position
      const nextScope = scopes.find(scope => {
        const scopeStartPos = new vscode.Position(scope.startLine, 0);
        return scopeStartPos.isAfter(position);
      });
      
      if (nextScope) {
        return {
          success: true,
          message: `Navigated to ${nextScope.scopeType}: ${nextScope.name}`,
          targetPosition: new vscode.Position(nextScope.startLine, 0),
          targetScopeInfo: nextScope
        };
      } else {
        // Wrap around to the first scope if configured
        const wrapAround = vscode.workspace.getConfiguration('scopeNavigation').get('wrapAround', true);
        if (wrapAround && scopes.length > 0) {
          const firstScope = scopes[0];
          return {
            success: true,
            message: `Wrapped to first ${firstScope.scopeType}: ${firstScope.name}`,
            targetPosition: new vscode.Position(firstScope.startLine, 0),
            targetScopeInfo: firstScope
          };
        } else {
          return {
            success: false,
            message: `No more ${scopeType !== 'any' ? scopeType + ' ' : ''}scopes found.`
          };
        }
      }
    } else {
      // Direction is backward
      // Find the last scope that starts before the current position
      const reversedScopes = [...scopes].reverse();
      const previousScope = reversedScopes.find(scope => {
        const scopeStartPos = new vscode.Position(scope.startLine, 0);
        return scopeStartPos.isBefore(position);
      });
      
      if (previousScope) {
        return {
          success: true,
          message: `Navigated to ${previousScope.scopeType}: ${previousScope.name}`,
          targetPosition: new vscode.Position(previousScope.startLine, 0),
          targetScopeInfo: previousScope
        };
      } else {
        // Wrap around to the last scope if configured
        const wrapAround = vscode.workspace.getConfiguration('scopeNavigation').get('wrapAround', true);
        if (wrapAround && scopes.length > 0) {
          const lastScope = scopes[scopes.length - 1];
          return {
            success: true,
            message: `Wrapped to last ${lastScope.scopeType}: ${lastScope.name}`,
            targetPosition: new vscode.Position(lastScope.startLine, 0),
            targetScopeInfo: lastScope
          };
        } else {
          return {
            success: false,
            message: `No more ${scopeType !== 'any' ? scopeType + ' ' : ''}scopes found.`
          };
        }
      }
    }
  }

  /**
   * Find all functions in the document
   * @param document The text document
   * @param scopeFinder The scope finder
   * @returns An array of scope information for all functions
   */
  private async findAllFunctions(
    document: vscode.TextDocument,
    scopeFinder: any
  ): Promise<ScopeInfo[]> {
    const functions: ScopeInfo[] = [];
    const lineCount = document.lineCount;
    
    // Scan all lines of the document
    for (let i = 0; i < lineCount; i++) {
      const linePosition = new vscode.Position(i, 0);
      const lineText = document.lineAt(i).text;
      
      // Skip empty lines or comment lines
      if (lineText.trim() === '' || this.isCommentLine(lineText)) {
        continue;
      }
      
      // Check if the line contains a function declaration
      const functionInfo = scopeFinder.findContainingFunction(document, linePosition);
      if (functionInfo && functionInfo.startLine === i) {
        functions.push(functionInfo);
      }
    }
    
    return functions;
  }

  /**
   * Find all classes in the document
   * @param document The text document
   * @param scopeFinder The scope finder
   * @returns An array of scope information for all classes
   */
  private async findAllClasses(
    document: vscode.TextDocument,
    scopeFinder: any
  ): Promise<ScopeInfo[]> {
    const classes: ScopeInfo[] = [];
    const lineCount = document.lineCount;
    
    // Scan all lines of the document
    for (let i = 0; i < lineCount; i++) {
      const linePosition = new vscode.Position(i, 0);
      const lineText = document.lineAt(i).text;
      
      // Skip empty lines or comment lines
      if (lineText.trim() === '' || this.isCommentLine(lineText)) {
        continue;
      }
      
      // Check if the line contains a class declaration
      const classInfo = scopeFinder.findContainingClass(document, linePosition);
      if (classInfo && classInfo.startLine === i) {
        classes.push(classInfo);
      }
    }
    
    return classes;
  }

  /**
   * Check if a line is a comment line
   * @param line The line text
   * @returns True if the line is a comment line, false otherwise
   */
  private isCommentLine(line: string): boolean {
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('//') || 
           trimmedLine.startsWith('/*') || 
           trimmedLine.startsWith('*') || 
           trimmedLine.startsWith('#');
  }
}
