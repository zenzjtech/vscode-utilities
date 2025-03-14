import * as vscode from 'vscode';
import { CommandRegistry, FeatureModule } from '../../core';

/**
 * Feature module for deleting code scopes (functions, methods, and classes)
 */
export class ScopeDeletionFeature extends FeatureModule {
  /**
   * Create a new ScopeDeletionFeature
   * @param commandRegistry The command registry service
   */
  constructor(commandRegistry: CommandRegistry) {
    super(commandRegistry, 'Scope Deletion');
  }

  /**
   * Register the scope deletion command
   */
  register(): void {
    const disposable = this.commandRegistry.registerTextEditorCommand(
      'extension.deleteCurrentScope',
      this.handleDeleteScope.bind(this)
    );
    
    this.addDisposable(disposable);
  }

  /**
   * Handle the delete scope command
   * @param editor The active text editor
   * @param edit The editor edit object
   */
  private async handleDeleteScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const position = editor.selection.active;
    const document = editor.document;
    const line_number = position.line;

    // First, try to detect if cursor is directly on a function/class definition
    const line_text = document.lineAt(line_number).text.trim();
    console.log(line_number, line_text, position);
    
    // Enhanced pattern detection for both TypeScript and JavaScript
    const function_match = /^(async\s+function|function)\s+\w+\s*\(/.test(line_text) || 
                          /^(async\s+)?(\w+)\s*\(\s*.*\s*\)\s*(\{|=>)/.test(line_text) || // Arrow functions and object methods
                          /^(const|let|var)\s+\w+\s*=\s*(async\s*)?\(\s*.*\s*\)\s*=>/.test(line_text); // Variable assigned functions
    
    const class_match = /^class\s+\w+/.test(line_text);
    
    // Method detection pattern (for class methods)
    const method_match = /^(async\s+)?[\w_$]+\s*(\(|\<)/.test(line_text) && 
                         !function_match && !class_match && line_text.includes('(');

    if (function_match || method_match) {
      await this.deleteFunction(editor, edit, position);
    } else if (class_match) {
      await this.deleteClass(editor, edit, position);
    } else {
      // Check if cursor is INSIDE a function or class scope
      
      // First, check if the cursor is inside a function body
      const containingFunction = this.findContainingFunction(document, position);
      if (containingFunction) {
        await this.deleteFunction(editor, edit, new vscode.Position(containingFunction.startLine, 0));
        return;
      }
      
      // Then check if cursor is inside a class, interface, or enum
      const containingClass = this.findContainingClass(document, position);
      if (containingClass) {
        if (containingClass.scopeType === 'class') {
          await this.deleteClass(editor, edit, new vscode.Position(containingClass.startLine, 0));
        } else if (containingClass.scopeType === 'interface') {
          await this.deleteInterface(editor, edit, new vscode.Position(containingClass.startLine, 0));
        } else if (containingClass.scopeType === 'enum') {
          await this.deleteEnum(editor, edit, new vscode.Position(containingClass.startLine, 0));
        }
        return;
      }
      
      vscode.window.showInformationMessage("Cursor is not within a function or class scope.");
    }
  }

  /**
   * Helper method to find the end line of a scope starting from a given line
   * @param document The text document
   * @param startLine The line where the scope starts
   * @param currentLine The current line (cursor position)
   * @returns The end line of the scope if the currentLine is within the scope, or null if not found
   */
  private findScopeBoundary(document: vscode.TextDocument, startLine: number, currentLine: number): number | null {
    const maxLines = document.lineCount;
    let bracketCount = 0;
    let foundOpeningBracket = false;
    
    for (let i = startLine; i < maxLines; i++) {
      const bracketLine = document.lineAt(i).text;
      
      // Count brackets
      for (let char = 0; char < bracketLine.length; char++) {
        if (bracketLine[char] === '{') {
          foundOpeningBracket = true;
          bracketCount++;
        } else if (bracketLine[char] === '}') {
          bracketCount--;
          
          // If brackets are balanced and we found the closing bracket
          if (foundOpeningBracket && bracketCount === 0) {
            // Check if current position is within this range
            if (i >= currentLine) {
              return i; // End line of the scope
            } else {
              // This scope ends before our current position, so it doesn't contain it
              return null;
            }
          }
        }
      }
    }
    
    return null; // No balanced closing bracket found
  }

  /**
   * Helper method to delete a scope by its boundaries
   * @param editor The active text editor
   * @param scopeStartLine The line where the scope starts
   * @param scopeType The type of scope being deleted (for the success message)
   */
  private async deleteScope(editor: vscode.TextEditor, scopeStartLine: number, scopeType: string): Promise<void> {
    const document = editor.document;
    const endLine = this.findScopeBoundary(document, scopeStartLine, scopeStartLine);
    
    if (endLine !== null) {
      // Extract the name of the scope (function, class, interface, enum)
      const startLineText = document.lineAt(scopeStartLine).text.trim();
      let scopeName = "unnamed";
      
      // Try to extract the name based on the scope type
      const nameMatch = startLineText.match(new RegExp(`(${scopeType.toLowerCase()})\\s+(\\w+)`, 'i'));
      if (nameMatch && nameMatch.length > 2) {
        scopeName = nameMatch[2];
      } else {
        // Alternative pattern for function expressions or methods
        const altMatch = startLineText.match(/(\w+)\s*[\(=]/);
        if (altMatch && altMatch.length > 1) {
          scopeName = altMatch[1];
        }
      }
      
      // Create a range from the scope start to end
      const range = new vscode.Range(
        new vscode.Position(scopeStartLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
      );
      
      // Calculate lines removed (adding 1 because line counts are zero-indexed)
      const linesRemoved = endLine - scopeStartLine + 1;
      
      // Delete the scope
      await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });
      
      // Show detailed message with appropriate icon
      const message = `${scopeType} '${scopeName}' deleted successfully!`;
      const detailMessage = `Deleted ${linesRemoved} lines (from line ${scopeStartLine + 1} to line ${endLine + 1})`;
      
      // Use different message types based on the scope type to get different icons
      if (scopeType.toLowerCase() === 'function') {
        vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
      } else if (scopeType.toLowerCase() === 'class') {
        // Using warning message type just to get a different icon
        vscode.window.showWarningMessage(message, { detail: detailMessage, modal: false });
      } else if (scopeType.toLowerCase() === 'interface') {
        vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
      } else if (scopeType.toLowerCase() === 'enum') {
        vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
      } else {
        vscode.window.showInformationMessage(message, { detail: detailMessage, modal: false });
      }
    } else {
      vscode.window.showErrorMessage(`Couldn't determine ${scopeType.toLowerCase()} boundaries.`);
    }
  }

  /**
   * Delete a function or method
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the function starts
   */
  private async deleteFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    await this.deleteScope(editor, position.line, "Function");
  }

  /**
   * Delete a class
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the class starts
   */
  private async deleteClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    await this.deleteScope(editor, position.line, "Class");
  }

  /**
   * Delete an interface
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the interface starts
   */
  private async deleteInterface(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    await this.deleteScope(editor, position.line, "Interface");
  }

  /**
   * Delete an enum
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the enum starts
   */
  private async deleteEnum(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    await this.deleteScope(editor, position.line, "Enum");
  }

  /**
   * Find a function that contains the given position
   * @param document The text document
   * @param position The position to check
   * @returns An object with startLine property if found, or null if not found
   */
  private findContainingFunction(document: vscode.TextDocument, position: vscode.Position): { startLine: number } | null {
    const maxLines = document.lineCount;
    const currentLine = position.line;
    
    // Search upward for function definition
    for (let line = currentLine; line >= 0; line--) {
      const lineText = document.lineAt(line).text.trim();
      
      // Check for function definitions
      const isFunctionDef = 
        /^(async\s+function|function)\s+\w+\s*\(/.test(lineText) || 
        /^(async\s+)?(\w+)\s*\(\s*.*\s*\)\s*(\{|=>)/.test(lineText) || 
        /^(const|let|var)\s+\w+\s*=\s*(async\s*)?\(\s*.*\s*\)\s*=>/.test(lineText) ||
        (/^(async\s+)?[\w_$]+\s*(\(|\<)/.test(lineText) && lineText.includes('('));
      
      if (isFunctionDef) {
        // Verify if this function contains the current position
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { startLine: line };
        }
      }
    }
    
    return null;
  }

  /**
   * Find a class, interface, or enum that contains the given position
   * @param document The text document
   * @param position The position to check
   * @returns An object with startLine and scopeType properties if found, or null if not found
   */
  private findContainingClass(document: vscode.TextDocument, position: vscode.Position): { startLine: number, scopeType: 'class' | 'interface' | 'enum' } | null {
    const maxLines = document.lineCount;
    const currentLine = position.line;
    
    // Search upward for class, interface, or enum definition
    for (let line = currentLine; line >= 0; line--) {
      const lineText = document.lineAt(line).text.trim();
      
      // Check for enum definition
      if (/^(export\s+)?(declare\s+)?enum\s+\w+/.test(lineText)) {
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { startLine: line, scopeType: 'enum' };
        }
      }
      
      // Check for interface definition
      if (/^(export\s+)?(declare\s+)?interface\s+\w+/.test(lineText)) {
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { startLine: line, scopeType: 'interface' };
        }
      }
      
      // Check for class definition - improved to handle TypeScript decorators and export patterns
      if (/^(export\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText) || 
          (line > 0 && /^@\w+/.test(document.lineAt(line - 1).text.trim()) && /^(export\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText)) ||
          /^(export\s+)?(declare\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText)) {
        const scopeEndLine = this.findScopeBoundary(document, line, currentLine);
        if (scopeEndLine !== null) {
          return { startLine: line, scopeType: 'class' };
        }
      }
    }
    
    return null;
  }

  // Helper utility to get indentation level
  private getIndentation(line: string): string {
    return line.match(/^(\s*)/)![1];
  }
}
