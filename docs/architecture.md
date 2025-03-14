# 🏗️ VSCode Utilities Extension Architecture

## 🔍 Overview

This document outlines the architecture for the VSCode Utilities extension, designed to make the extension more extensible, maintainable, and capable of supporting multiple programming languages with different versions.

## 🧱 Core Architectural Principles

1. **📦 Modular Design**: Each feature is encapsulated in its own module
2. **🔄 Strategy Pattern**: Language-specific implementations are interchangeable
3. **💉 Dependency Injection**: Services and components are loosely coupled
4. **⚡ Progressive Enhancement**: Basic features work with all languages, advanced features with fully supported languages
5. **🔍 Separation of Concerns**: UI, business logic, and language-specific operations are separated

## 🏛️ Architecture Components

### 1. Core Architectural Components

#### A. Command Registry 📝
- Central hub for registering all commands
- Each feature registers its commands through this registry
- Decouples command registration from implementation

#### B. Language Provider System 🌐
- Strategy pattern for language-specific implementations
- Language provider interface/abstract class
- Concrete implementations for each supported language
- Language detection service to select appropriate provider

#### C. Feature Modules 🧩
- Each feature (like scope deletion) becomes a self-contained module
- Modules register their commands with the command registry
- Modules request the appropriate language provider for operations
- Features follow a consistent internal structure:
  - `types.ts`: Common interfaces and types
  - `finders/`: Language-specific implementations for finding code structures
  - `handlers.ts`: Command handlers and business logic
  - `ui-utils.ts`: UI-related utilities and presentation logic
  - `index.ts`: Feature entry point and re-exports

### 2. Directory Structure 📂

```
src/
├── extension.ts                 # Entry point - lean, just initializes core systems
├── core/
│   ├── command-registry.ts      # Central command registration system
│   ├── language-provider.ts     # Base interfaces for language providers
│   └── feature-module.ts        # Base class for feature modules
├── languages/
│   ├── language-detector.ts     # Detects active language
│   ├── javascript-provider.ts   # JavaScript implementation
│   ├── typescript-provider.ts   # TypeScript implementation 
│   └── other-language-providers/# Folder for future language providers
├── features/
│   ├── scope-deletion/          # Scope deletion feature (refactored)
│   │   ├── index.ts             # Feature entry point
│   │   ├── types.ts             # Common interfaces and types
│   │   ├── ui-utils.ts          # UI-related utilities
│   │   ├── handlers.ts          # Command handlers
│   │   └── finders/             # Language-specific finders
│   │       ├── index.ts         # Factory for language finders
│   │       ├── typescript-finder.ts # TypeScript implementation
│   │       └── python-finder.ts # Python implementation
│   ├── bracket-scope/           # Bracket scope feature (refactored)
│   │   ├── index.ts             # Feature entry point
│   │   ├── types.ts             # Common interfaces and types
│   │   ├── ui-utils.ts          # UI-related utilities
│   │   ├── handlers.ts          # Command handlers
│   │   └── finders/             # Language-specific finders
│   │       ├── index.ts         # Factory for language finders
│   │       └── curly-bracket-finder.ts # Curly bracket implementation
│   ├── sexp-navigation/         # S-expression navigation feature
│   │   ├── index.ts             # Feature entry point
│   │   ├── types.ts             # Common interfaces and types
│   │   ├── ui-utils.ts          # UI-related utilities
│   │   ├── handlers.ts          # Command handlers
│   │   └── finders/             # Language-specific finders
│   │       ├── index.ts         # Factory for language finders
│   │       └── typescript-navigator.ts # TypeScript implementation
│   ├── scope-navigation/        # Scope navigation feature
│   │   ├── index.ts             # Feature entry point
│   │   ├── types.ts             # Navigation result and direction types
│   │   └── handlers.ts          # Command handlers for scope navigation
│   └── [future-features]/       # Structure for new features
└── utils/
    ├── document-utils.ts        # Document helper functions
    └── position-utils.ts        # Position calculation utilities
```

### 3. Implementation Details 🔧

#### Feature Module Internal Structure

The scope-deletion and bracket-scope features now follow a consistent internal structure:

1. **Types**: Define common interfaces and types needed across the feature
   ```typescript
   // features/scope-deletion/types.ts
   export interface ScopeInfo {
     scopeType: ScopeType;
     name: string;
     startLine: number;
   }
   
   export interface ScopeFinder {
     readonly languageId: string;
     findContainingFunction(document: vscode.TextDocument, position: vscode.Position): ScopeInfo | null;
     findContainingClass(document: vscode.TextDocument, position: vscode.Position): ScopeInfo | null;
     findScopeBoundary(document: vscode.TextDocument, startLine: number, currentLine: number): number | null;
   }
   ```

2. **Finders**: Language-specific implementations for finding code structures
   ```typescript
   // features/scope-deletion/finders/typescript-finder.ts
   export class TypeScriptScopeFinder implements ScopeFinder {
     public readonly languageId: string = 'typescript';
     
     public findContainingFunction(document: vscode.TextDocument, position: vscode.Position): ScopeInfo | null {
       // TypeScript-specific implementation
     }
     
     public findContainingClass(document: vscode.TextDocument, position: vscode.Position): ScopeInfo | null {
       // TypeScript-specific implementation
     }
   }
   
   // features/scope-deletion/finders/python-finder.ts
   export class PythonScopeFinder implements ScopeFinder {
     public readonly languageId: string = 'python';
     
     public findContainingFunction(document: vscode.TextDocument, position: vscode.Position): ScopeInfo | null {
       // Python-specific implementation using indentation-based scoping
     }
     
     public findContainingClass(document: vscode.TextDocument, position: vscode.Position): ScopeInfo | null {
       // Python-specific implementation using indentation-based scoping
     }
   }
   
   // features/scope-deletion/finders/index.ts
   export class ScopeFinderFactory {
     private static finders: Map<string, ScopeFinder> = new Map();
     
     public static getFinder(languageId: string): ScopeFinder {
       // Return appropriate finder for language
     }
     
     public static registerFinder(finder: ScopeFinder): void {
       // Register a new finder
     }
   }
   ```

3. **Handlers**: Command handlers and business logic
   ```typescript
   // features/scope-deletion/handlers.ts
   export class ScopeHandlers {
     public static async handleDeleteScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, currentScopeInfo: ScopeInfo | null): Promise<void> {
       // Implementation that uses the appropriate finder and UI utils
     }
     
     public static async handleSelectScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, currentScopeInfo: ScopeInfo | null): Promise<void> {
       // Implementation that uses the appropriate finder and UI utils
     }
   }
   ```

4. **UI Utilities**: UI-related utilities and presentation logic
   ```typescript
   // features/scope-deletion/ui-utils.ts
   export class ScopeUiUtils {
     public static showSuccessMessage(scopeType: ScopeType, scopeName: string, linesRemoved: number): void {
       // Show appropriate message
     }
     
     public static async highlightAndConfirmDeletion(editor: vscode.TextEditor, startLine: number, scopeType: string): Promise<boolean> {
       // Highlight scope and ask for confirmation
     }
   }
   ```

5. **Feature Entry Point**: Coordinates between components and re-exports
   ```typescript
   // features/scope-deletion/index.ts
   export class ScopeDeletionFeature extends FeatureModule {
     constructor(commandRegistry: CommandRegistry) {
       super(commandRegistry, 'Scope Deletion');
       // Initialize
       ScopeFinderFactory.initialize();
     }
     
     register(): void {
       // Register commands using the handlers
     }
     
     // Other methods...
   }
   
   // Re-export types and utilities for external use
   export * from './types';
   export * from './finders';
   export * from './handlers';
   export * from './ui-utils';
   ```

#### Scope Navigation Feature Structure

The scope navigation feature follows a simplified architecture pattern that leverages the existing scope-detection infrastructure:

1. **Types**: Basic types for navigation results and direction
   ```typescript
   // features/scope-navigation/types.ts
   export interface ScopeNavigationResult {
     success: boolean;
     message: string;
     targetPosition?: vscode.Position;
     targetScopeInfo?: ScopeInfo;
   }
   
   export enum NavigationDirection {
     Forward = 'forward',
     Backward = 'backward'
   }
   ```

2. **Handlers**: Specialized handlers for function and class navigation
   ```typescript
   // features/scope-navigation/handlers.ts
   export class ScopeNavigationHandlers {
     public async handleNextFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
       // Implementation for navigating to next function
     }
     
     public async handlePreviousFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
       // Implementation for navigating to previous function
     }
     
     public async handleNextClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
       // Implementation for navigating to next class
     }
     
     public async handlePreviousClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit): Promise<void> {
       // Implementation for navigating to previous class
     }
     
     // Additional methods for general scope navigation and internal implementation
   }
   ```

3. **Feature Entry Point**: Registers commands for navigation operations
   ```typescript
   // features/scope-navigation/index.ts
   export class ScopeNavigationFeature extends FeatureModule {
     private handlers: ScopeNavigationHandlers;
     
     constructor(commandRegistry: CommandRegistry) {
       super(commandRegistry, 'Scope Navigation');
       this.handlers = new ScopeNavigationHandlers();
     }
     
     register(): void {
       // Register navigation commands
       this.commandRegistry.registerTextEditorCommand(
         'extension.nextFunction',
         this.handlers.handleNextFunction.bind(this.handlers)
       );
       
       // Additional command registrations...
     }
   }
   ```

#### Language Provider Interface
```typescript
// core/language-provider.ts
export interface LanguageProvider {
  id: string;
  supportedVersions: string[];
  
  // Language-specific capabilities
  canFindScopeBoundaries(): boolean;
  canDetectExpressionTypes(): boolean;
  
  // Implementation methods
  findScope(document: vscode.TextDocument, position: vscode.Position, scopeType: string): any;
  findExpressionBoundaries(document: vscode.TextDocument, position: vscode.Position): any;
}
```

#### Command Registry
```typescript
// core/command-registry.ts
export class CommandRegistry {
  private commands: Map<string, vscode.Disposable> = new Map();
  
  register(id: string, command: (...args: any[]) => any): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(id, command);
    this.commands.set(id, disposable);
    return disposable;
  }
  
  registerTextEditorCommand(id: string, command: (editor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) => any): vscode.Disposable {
    const disposable = vscode.commands.registerTextEditorCommand(id, command);
    this.commands.set(id, disposable);
    return disposable;
  }
  
  getDisposables(): vscode.Disposable[] {
    return Array.from(this.commands.values());
  }
}
```

#### Feature Module Base Class
```typescript
// core/feature-module.ts
export abstract class FeatureModule {
  protected commandRegistry: CommandRegistry;
  private disposables: vscode.Disposable[] = [];
  private isActive: boolean = false;
  private name: string;
  
  constructor(commandRegistry: CommandRegistry, name: string) {
    this.commandRegistry = commandRegistry;
    this.name = name;
  }
  
  getName(): string {
    return this.name;
  }
  
  abstract register(): void;
  
  activate(): void {
    this.isActive = true;
  }
  
  deactivate(): void {
    this.isActive = false;
  }
  
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
  
  protected addDisposable(disposable: vscode.Disposable): void {
    this.disposables.push(disposable);
  }
}
```

### 4. Key Dependencies and Integration Points

#### Feature Integration
- **Integration Point 1**: Feature modules register commands with the command registry
- **Integration Point 2**: Feature modules use language providers or finders to support multiple languages
- **Integration Point 3**: Features can reuse utilities and finders from other features as needed (e.g., scope navigation uses scope deletion's finders)

#### VSCode API Integration
- **Integration Point 4**: Command registry wraps VSCode's command registration system
- **Integration Point 5**: UI utilities use VSCode's window, editor, and decoration API
- **Integration Point 6**: Feature modules access editor state via VSCode's editor API

### 5. Class Relationships and Interactions

#### Feature Module Relationships
- **FeatureModule** is the base class for all feature modules
- Each feature module (e.g., ScopeDeletionFeature) extends FeatureModule
- Feature modules own their respective handlers and interact with finder factories

#### Factory Pattern Relationships
- Each feature has its own factory for managing language-specific implementations
- Factories create and return appropriate implementations based on language ID
- Factories register implementations at initialization

#### Handler Relationships
- Handlers implement command functionality
- Handlers use finders to locate code structures
- Handlers use UI utilities for user interaction

### 6. Architecture Evolution Plan

| **Phase** | **Focus Area** | **Complexity** | **Priority** |
|-----------|----------------|----------------|--------------|
| **1** | Modularize existing features | Medium | High |
|       | • Refactor monolithic functions into modules | | |
|       | • Create common interfaces for each feature | | |
|       | • Implement basic command registry | | |
| **2** | Create core infrastructure | High | High |
|       | • Implement command registry | | |
|       | • Create feature module base class | | |
|       | • Design language provider interface | | |
| **3** | Add support for more languages | Medium | Medium |
|       | • Implement language detectors | | |
|       | • Create Python-specific finders | | |
|       | • Create fallback finders for unsupported languages | | |
| **4** | Enhance UI and feedback | Medium | Low |
|       | • Improve visual feedback for operations | | |
|       | • Create consistent UI interaction patterns | | |
|       | • Add more configuration options | | |
| **5** | Additional features | High | Medium |
|       | • Add scope navigation | | |
|       | • Implement scope visualization | | |
|       | • Add more S-expression operations | | |
