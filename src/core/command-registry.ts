import * as vscode from 'vscode';

/**
 * CommandRegistry provides a centralized system for registering and managing
 * commands in the VS Code extension. This enables better organization and
 * modularization of command-related functionality.
 */
export class CommandRegistry {
  /**
   * Map of command IDs to their disposable registrations
   */
  private commands: Map<string, vscode.Disposable> = new Map();

  /**
   * Register a regular command with VS Code
   * @param id Command identifier (e.g., 'extension.commandName')
   * @param command Command implementation function
   * @param thisArg Optional 'this' context for the command
   * @returns The disposable registration
   */
  register(id: string, command: (...args: any[]) => any, thisArg?: any): vscode.Disposable {
    // Check if command is already registered
    if (this.commands.has(id)) {
      console.warn(`Command '${id}' is already registered. Overwriting previous registration.`);
      this.commands.get(id)?.dispose();
    }

    // Register the command with VS Code
    const disposable = vscode.commands.registerCommand(id, command, thisArg);
    this.commands.set(id, disposable);
    
    return disposable;
  }

  /**
   * Register a text editor command with VS Code (commands that apply to the active text editor)
   * @param id Command identifier (e.g., 'extension.textEditorCommand')
   * @param command Command implementation function that receives the active editor
   * @param thisArg Optional 'this' context for the command
   * @returns The disposable registration
   */
  registerTextEditorCommand(
    id: string,
    command: (editor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) => any,
    thisArg?: any
  ): vscode.Disposable {
    // Check if command is already registered
    if (this.commands.has(id)) {
      console.warn(`Command '${id}' is already registered. Overwriting previous registration.`);
      this.commands.get(id)?.dispose();
    }

    // Register the text editor command with VS Code
    const disposable = vscode.commands.registerTextEditorCommand(id, command, thisArg);
    this.commands.set(id, disposable);
    
    return disposable;
  }

  /**
   * Get all registered disposables for cleanup
   * @returns Array of all command disposables
   */
  getDisposables(): vscode.Disposable[] {
    return Array.from(this.commands.values());
  }

  /**
   * Dispose of a specific command by ID
   * @param id Command identifier to dispose
   * @returns true if command was found and disposed, false otherwise
   */
  disposeCommand(id: string): boolean {
    const disposable = this.commands.get(id);
    if (disposable) {
      disposable.dispose();
      this.commands.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Check if a command is registered
   * @param id Command identifier to check
   * @returns true if command is registered, false otherwise
   */
  hasCommand(id: string): boolean {
    return this.commands.has(id);
  }

  /**
   * Dispose all registered commands
   */
  dispose(): void {
    this.commands.forEach(disposable => {
      disposable.dispose();
    });
    this.commands.clear();
  }
}
