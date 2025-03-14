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
  async handleDeleteScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
    const document = editor.document;
    const position = editor.selection.active;
    
    // First try to find if cursor is inside a function
    const containingFunction = this.findContainingFunction(document, position);
    if (containingFunction) {
      // Check if highlighting is enabled in configuration
      const config = vscode.workspace.getConfiguration('vscodeUtilities');
      const highlightBeforeDeleting = config.get<boolean>('highlightBeforeDeleting', false);
      
      if (highlightBeforeDeleting) {
        // Highlight the function scope and confirm
        if (await this.highlightAndConfirmDeletion(editor, containingFunction.startLine, 'Function')) {
          await this.deleteFunction(editor, edit, new vscode.Position(containingFunction.startLine, 0));
        }
      } else {
        // Delete without highlighting
        await this.deleteFunction(editor, edit, new vscode.Position(containingFunction.startLine, 0));
      }
      return;
    }
    
    // Then check if cursor is inside a class, interface, or enum
    const containingClass = this.findContainingClass(document, position);
    if (containingClass) {
      // Check if highlighting is enabled in configuration
      const config = vscode.workspace.getConfiguration('vscodeUtilities');
      const highlightBeforeDeleting = config.get<boolean>('highlightBeforeDeleting', false);
      
      if (containingClass.scopeType === 'class') {
        if (highlightBeforeDeleting) {
          // Highlight the class scope and confirm
          if (await this.highlightAndConfirmDeletion(editor, containingClass.startLine, 'Class')) {
            await this.deleteClass(editor, edit, new vscode.Position(containingClass.startLine, 0));
          }
        } else {
          // Delete without highlighting
          await this.deleteClass(editor, edit, new vscode.Position(containingClass.startLine, 0));
        }
      } else if (containingClass.scopeType === 'interface') {
        if (highlightBeforeDeleting) {
          // Highlight the interface scope and confirm
          if (await this.highlightAndConfirmDeletion(editor, containingClass.startLine, 'Interface')) {
            await this.deleteInterface(editor, edit, new vscode.Position(containingClass.startLine, 0));
          }
        } else {
          // Delete without highlighting
          await this.deleteInterface(editor, edit, new vscode.Position(containingClass.startLine, 0));
        }
      } else if (containingClass.scopeType === 'enum') {
        if (highlightBeforeDeleting) {
          // Highlight the enum scope and confirm
          if (await this.highlightAndConfirmDeletion(editor, containingClass.startLine, 'Enum')) {
            await this.deleteEnum(editor, edit, new vscode.Position(containingClass.startLine, 0));
          }
        } else {
          // Delete without highlighting
          await this.deleteEnum(editor, edit, new vscode.Position(containingClass.startLine, 0));
        }
      }
      return;
    }
    
    vscode.window.showInformationMessage("Cursor is not within a function or class scope.");
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
      
      // Get the text content of the scope
      const scopeText = document.getText(range);
      
      // Check if we should copy to clipboard
      const configuration = vscode.workspace.getConfiguration('vscodeUtilities');
      const copyToClipboard = configuration.get<boolean>('copyToClipboard', true);
      
      // Copy to clipboard if enabled
      if (copyToClipboard) {
        await vscode.env.clipboard.writeText(scopeText);
      }
      
      // Calculate lines removed (adding 1 because line counts are zero-indexed)
      const linesRemoved = endLine - scopeStartLine + 1;
      
      // Delete the scope
      await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });
      
      // Show detailed message with appropriate icon
      const message = `${scopeType} '${scopeName}' deleted successfully!`;
      let detailMessage = `Deleted ${linesRemoved} lines (from line ${scopeStartLine + 1} to line ${endLine + 1})`;
      
      // Add clipboard info to the message if enabled
      if (copyToClipboard) {
        detailMessage += ". Content copied to clipboard.";
      }
      
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

  /**
   * Highlight the scope that will be deleted and ask for confirmation
   * @param editor The active text editor
   * @param startLine The start line of the scope
   * @param scopeType The type of scope (Function, Class, Interface, Enum)
   * @returns True if the user confirms deletion, false otherwise
   */
  private async highlightAndConfirmDeletion(editor: vscode.TextEditor, startLine: number, scopeType: string): Promise<boolean> {
    const document = editor.document;
    const endLine = this.findScopeBoundary(document, startLine, startLine);
    
    if (endLine === null) {
      vscode.window.showErrorMessage(`Couldn't determine ${scopeType.toLowerCase()} boundaries.`);
      return false;
    }
    
    // Extract the name of the scope (function, class, interface, enum)
    const startLineText = document.lineAt(startLine).text.trim();
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
    
    // Calculate lines that will be removed
    const linesRemoved = endLine - startLine + 1;
    
    // Create a range for highlighting
    const highlightRange = new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
    
    // Store the original selections
    const originalSelections = [...editor.selections];
    
    // Create a new selection that covers the entire scope
    editor.selection = new vscode.Selection(
      highlightRange.start,
      highlightRange.end
    );
    
    // Create a decoration type for the highlighting
    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
      border: '1px solid',
      borderColor: new vscode.ThemeColor('editor.selectionHighlightBorder')
    });
    
    // Apply the decoration
    editor.setDecorations(decorationType, [highlightRange]);
    
    // Scroll to show the highlighted area
    editor.revealRange(highlightRange, vscode.TextEditorRevealType.InCenter);
    
    // Ask for confirmation
    const result = await vscode.window.showWarningMessage(
      `Delete ${scopeType.toLowerCase()} '${scopeName}'?`,
      { detail: `This will remove ${linesRemoved} lines of code (from line ${startLine + 1} to ${endLine + 1})`, modal: false },
      { title: 'Delete', isCloseAffordance: false },
      { title: 'Cancel', isCloseAffordance: true }
    );
    
    // Remove the decoration
    decorationType.dispose();
    
    // Restore the original selections
    editor.selections = originalSelections;
    
    // Return true if the user clicked 'Delete'
    return result?.title === 'Delete';
  }

  // Helper utility to get indentation level
  private getIndentation(line: string): string {
    return line.match(/^(\s*)/)![1];
  }
}
