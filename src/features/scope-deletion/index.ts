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
   * Delete a function or method
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the function starts
   */
  private async deleteFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    const document = editor.document;
    const line_number = position.line;
    const line_text = document.lineAt(line_number).text;
    
    let function_start_line = line_number;
    let function_end_line = -1;
    let bracket_count = 0;
    let found_opening_bracket = false;
    
    // Find opening bracket
    for (let i = function_start_line; i < document.lineCount; i++) {
      const current_line = document.lineAt(i).text;
      
      if (current_line.includes('{')) {
        found_opening_bracket = true;
        bracket_count++;
      }
      
      if (found_opening_bracket && current_line.includes('}')) {
        bracket_count--;
        
        if (bracket_count === 0) {
          function_end_line = i;
          break;
        }
      }
    }
    
    if (function_end_line !== -1) {
      // Create a range from the function start to end
      const range = new vscode.Range(
        new vscode.Position(function_start_line, 0),
        new vscode.Position(function_end_line, document.lineAt(function_end_line).text.length)
      );
      
      // Delete the function
      await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });
      
      vscode.window.showInformationMessage("Function deleted successfully!");
    } else {
      vscode.window.showErrorMessage("Couldn't determine function boundaries.");
    }
  }

  /**
   * Delete a class
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the class starts
   */
  private async deleteClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    const document = editor.document;
    const line_number = position.line;
    const line_text = document.lineAt(line_number).text;
    
    let class_start_line = line_number;
    let class_end_line = -1;
    let bracket_count = 0;
    let found_opening_bracket = false;
    
    // Find opening and closing brackets
    for (let i = class_start_line; i < document.lineCount; i++) {
      const current_line = document.lineAt(i).text;
      
      if (current_line.includes('{')) {
        found_opening_bracket = true;
        bracket_count++;
      }
      
      if (found_opening_bracket && current_line.includes('}')) {
        bracket_count--;
        
        if (bracket_count === 0) {
          class_end_line = i;
          break;
        }
      }
    }
    
    if (class_end_line !== -1) {
      // Create a range from the class start to end
      const range = new vscode.Range(
        new vscode.Position(class_start_line, 0),
        new vscode.Position(class_end_line, document.lineAt(class_end_line).text.length)
      );
      
      // Delete the class
      await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });
      
      vscode.window.showInformationMessage("Class deleted successfully!");
    } else {
      vscode.window.showErrorMessage("Couldn't determine class boundaries.");
    }
  }

  /**
   * Delete an interface
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the interface starts
   */
  private async deleteInterface(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    const document = editor.document;
    const line_number = position.line;
    const line_text = document.lineAt(line_number).text;
    
    let interface_start_line = line_number;
    let interface_end_line = -1;
    let bracket_count = 0;
    let found_opening_bracket = false;
    
    // Find opening and closing brackets
    for (let i = interface_start_line; i < document.lineCount; i++) {
      const current_line = document.lineAt(i).text;
      
      if (current_line.includes('{')) {
        found_opening_bracket = true;
        bracket_count++;
      }
      
      if (found_opening_bracket && current_line.includes('}')) {
        bracket_count--;
        
        if (bracket_count === 0) {
          interface_end_line = i;
          break;
        }
      }
    }
    
    if (interface_end_line !== -1) {
      // Create a range from the interface start to end
      const range = new vscode.Range(
        new vscode.Position(interface_start_line, 0),
        new vscode.Position(interface_end_line, document.lineAt(interface_end_line).text.length)
      );
      
      // Delete the interface
      await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });
      
      vscode.window.showInformationMessage("Interface deleted successfully!");
    } else {
      vscode.window.showErrorMessage("Couldn't determine interface boundaries.");
    }
  }

  /**
   * Delete an enum
   * @param editor The active text editor
   * @param edit The editor edit object
   * @param position Position where the enum starts
   */
  private async deleteEnum(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position): Promise<void> {
    const document = editor.document;
    const line_number = position.line;
    const line_text = document.lineAt(line_number).text;
    
    let enum_start_line = line_number;
    let enum_end_line = -1;
    let bracket_count = 0;
    let found_opening_bracket = false;
    
    // Find opening and closing brackets
    for (let i = enum_start_line; i < document.lineCount; i++) {
      const current_line = document.lineAt(i).text;
      
      if (current_line.includes('{')) {
        found_opening_bracket = true;
        bracket_count++;
      }
      
      if (found_opening_bracket && current_line.includes('}')) {
        bracket_count--;
        
        if (bracket_count === 0) {
          enum_end_line = i;
          break;
        }
      }
    }
    
    if (enum_end_line !== -1) {
      // Create a range from the enum start to end
      const range = new vscode.Range(
        new vscode.Position(enum_start_line, 0),
        new vscode.Position(enum_end_line, document.lineAt(enum_end_line).text.length)
      );
      
      // Delete the enum
      await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });
      
      vscode.window.showInformationMessage("Enum deleted successfully!");
    } else {
      vscode.window.showErrorMessage("Couldn't determine enum boundaries.");
    }
  }

  // Helper utility to get indentation level
  private getIndentation(line: string): string {
    return line.match(/^(\s*)/)![1];
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
        // by checking bracket balance
        let bracketCount = 0;
        let foundOpeningBracket = false;
        
        for (let i = line; i < maxLines; i++) {
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
                  return { startLine: line };
                } else {
                  // This function ends before our position, so it doesn't contain it
                  break;
                }
              }
            }
          }
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
        // Verify if this enum contains the current position
        let bracketCount = 0;
        let foundOpeningBracket = false;
        
        for (let i = line; i < maxLines; i++) {
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
                  return { startLine: line, scopeType: 'enum' };
                } else {
                  // This enum ends before our position, so it doesn't contain it
                  break;
                }
              }
            }
          }
        }
      }
      
      // Check for interface definition
      if (/^(export\s+)?(declare\s+)?interface\s+\w+/.test(lineText)) {
        // Verify if this interface contains the current position
        let bracketCount = 0;
        let foundOpeningBracket = false;
        
        for (let i = line; i < maxLines; i++) {
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
                  return { startLine: line, scopeType: 'interface' };
                } else {
                  // This interface ends before our position, so it doesn't contain it
                  break;
                }
              }
            }
          }
        }
      }
      
      // Check for class definition - improved to handle TypeScript decorators and export patterns
      if (/^(export\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText) || 
          (line > 0 && /^@\w+/.test(document.lineAt(line - 1).text.trim()) && /^(export\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText)) ||
          /^(export\s+)?(declare\s+)?(abstract\s+)?(class)\s+\w+/.test(lineText)) {
        // Verify if this class contains the current position
        let bracketCount = 0;
        let foundOpeningBracket = false;
        
        for (let i = line; i < maxLines; i++) {
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
                  return { startLine: line, scopeType: 'class' };
                } else {
                  // This class ends before our position, so it doesn't contain it
                  break;
                }
              }
            }
          }
        }
      }
    }
    
    return null;
  }
}
