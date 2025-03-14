import * as vscode from 'vscode';
import { CommandRegistry, container } from './core';
import { ScopeDeletionFeature, BracketScopeFeature, SexpNavigationFeature, ScopeNavigationFeature } from './features';

/**
 * Activate the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('VSCode Utilities extension is now active!');

    // Create the command registry
    const commandRegistry = new CommandRegistry();
    container.register('commandRegistry', commandRegistry);

    // Initialize and register features
    const features = [
        new ScopeDeletionFeature(commandRegistry),
        new BracketScopeFeature(commandRegistry),
        new SexpNavigationFeature(commandRegistry),
        new ScopeNavigationFeature(commandRegistry)
    ];

    // Register all features
    features.forEach(feature => {
        console.log(`Registering feature: ${feature.getName()}`);
        feature.register();
        feature.activate();
    });

    // Add all disposables from the command registry to the extension context
    context.subscriptions.push(...commandRegistry.getDisposables());

    // Add a disposable to clean up the features when the extension is deactivated
    context.subscriptions.push({
        dispose: () => {
            features.forEach(feature => feature.deactivate());
        }
    });
}

/**
 * Deactivate the extension
 */
export function deactivate() {
    console.log('VSCode Utilities extension is now deactivated!');
}

// The interfaces and functions below are kept for backwards compatibility during migration
// They will be removed in future versions once all code is migrated to the new architecture

/**
 * Interface for bracket pair positions
 */
interface BracketPair {
    openBracketLine: number;
    openBracketChar: number;
    closeBracketLine: number;
    closeBracketChar: number;
}

// Legacy functions - these are now implemented in feature modules
// They are kept here temporarily to ensure backward compatibility during migration

async function deleteBracketScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position) {
    // This is a compatibility wrapper that delegates to the new feature module
    await vscode.commands.executeCommand('extension.deleteCurrentBracketScope');
}

function findBracketPairContainingCursor(document: vscode.TextDocument, cursorLine: number, cursorChar: number): BracketPair | null {
    // Legacy implementation - kept for reference
    return null;
}

function findNextBracketPair(document: vscode.TextDocument, cursorLine: number, cursorChar: number): BracketPair | null {
    // Legacy implementation - kept for reference
    return null;
}

async function deleteFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position) {
    // This is a compatibility wrapper that delegates to the new feature module
    await vscode.commands.executeCommand('extension.deleteCurrentScope');
}

async function deleteClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position) {
    // This is a compatibility wrapper that delegates to the new feature module
    await vscode.commands.executeCommand('extension.deleteCurrentScope');
}

function getIndentation(line: string): string {
    return line.match(/^(\s*)/)![1];
}

function findContainingFunction(document: vscode.TextDocument, position: vscode.Position): { startLine: number } | null {
    // Legacy implementation - kept for reference
    return null;
}

function findContainingClass(document: vscode.TextDocument, position: vscode.Position): { startLine: number } | null {
    // Legacy implementation - kept for reference
    return null;
}