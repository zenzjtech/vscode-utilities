# 🗺️ VSCode Utilities Project Mapping

This document provides a comprehensive map of the VSCode Utilities extension codebase, helping you understand the organization and purpose of each file and directory.

## 📁 Project Structure Overview

```
vscode-utilities/
├── .vscode/                # VSCode specific settings
├── docs/                   # Documentation
│   ├── architecture.md     # Architectural overview and design
│   ├── change_logs/        # Logs of changes made to the project
│   ├── commit_convention.md# Commit message guidelines
│   ├── current_task.md     # Current development focus
│   ├── entrypoints.md      # Entry points for modules
│   └── project_mapping.md  # This file - project structure map
├── src/                    # Source code
│   ├── core/               # Core utilities and base classes
│   ├── features/           # Feature modules
│   └── extension.ts        # Extension entry point
├── package.json            # Extension metadata and dependencies
└── README.md               # Project overview
```

## 📂 Source Code Structure

### 🏗️ Core Module (`src/core/`)

Contains base classes, interfaces, and services that are used across the extension.

| File | Description |
|------|-------------|
| `command-registry.ts` | Central hub for registering all commands |
| `feature-module.ts` | Base class for all feature modules |

### 🧩 Features (`src/features/`)

Each feature is organized in its own directory with a consistent structure.

#### Bracket Scope Feature (`src/features/bracket-scope/`)

Handles bracket scope selection and deletion operations.

| File | Description |
|------|-------------|
| `index.ts` | Feature entry point, coordinates components and re-exports types |
| `types.ts` | Defines interfaces like `BracketPair` and `BracketFinder` |
| `handlers.ts` | Contains command handlers for delete and select operations |
| `ui-utils.ts` | UI-related utilities for highlighting and messaging |
| `finders/index.ts` | Factory for managing language-specific bracket finders |
| `finders/curly-bracket-finder.ts` | Implementation for curly bracket finding |

#### Scope Deletion Feature (`src/features/scope-deletion/`)

Handles detection and deletion of code scopes like functions, classes, interfaces, and enums.

| File | Description |
|------|-------------|
| `index.ts` | Feature entry point, coordinates components and re-exports types |
| `types.ts` | Defines interfaces like `ScopeInfo` and `ScopeFinder` |
| `handlers.ts` | Contains command handlers for delete and select operations |
| `ui-utils.ts` | UI-related utilities for highlighting and messaging |
| `finders/index.ts` | Factory for managing language-specific scope finders |
| `finders/typescript-finder.ts` | Implementation for TypeScript/JavaScript scope finding |
| `finders/python-finder.ts` | Implementation for Python scope finding using indentation-based blocks |

#### S-expression Navigation Feature (`src/features/sexp-navigation/`)

Provides Emacs-like navigation, selection, and manipulation of balanced expressions (S-expressions).

| File | Description |
|------|-------------|
| `index.ts` | Feature entry point, registers commands and initializes navigator factory |
| `types.ts` | Defines interfaces for S-expression boundaries and navigators |
| `ui-utils.ts` | UI-related utilities for status messages and visual feedback |
| `finders/index.ts` | Factory for language-specific S-expression navigators |
| `finders/typescript-navigator.ts` | Implementation for TypeScript/JavaScript S-expression navigation |
| `handlers/` | Directory containing specialized handler modules |
| `handlers/index.ts` | Facade that maintains backward compatibility for the API |
| `handlers/base-handler.ts` | Abstract base class with common utility methods |
| `handlers/navigation-handlers.ts` | Handlers for forward and backward navigation commands |
| `handlers/selection-handlers.ts` | Handlers for marking and selecting expressions |
| `handlers/transposition-handlers.ts` | Handlers for transposing and rearranging expressions |
| `handlers.ts` | Original handler file (deprecated, maintained for reference) |

### 🚪 Extension Entry Point (`src/extension.ts`)

The main entry point for the extension, responsible for:
- Activating and deactivating the extension
- Setting up the command registry
- Initializing and registering feature modules

## 🔄 Data Flow

1. **Command Registration**:
   - Each feature registers its commands through the command registry
   - Commands are bound to handler methods in the feature modules

2. **Command Execution**:
   - User triggers a command in VSCode
   - VSCode calls the registered handler function
   - Handler uses appropriate finders and utilities to implement the command
   - UI utilities provide feedback to the user

3. **Language-specific Operations**:
   - Finder factories select the appropriate implementation for the current language
   - Language-specific logic is encapsulated in finder classes
   - Main feature modules remain language-agnostic by delegating to finders

## 🔍 Recently Refactored Components

The following components have been recently refactored to improve modularity and maintainability:

1. **Bracket Scope Feature**
   - Separated UI, handler and finder logic
   - Implemented factory pattern for language-specific bracket finders
   - Created interfaces for standardizing bracket handling

2. **Scope Deletion Feature**
   - Moved from monolithic class to modular structure
   - Separated UI utilities, command handlers, and scope finders
   - Implemented factory pattern for language-specific scope finders
   - Added support for multiple programming languages:
     - TypeScript/JavaScript
     - Python (indentation-based scope detection)

3. **S-expression Navigation Feature**
   - Implemented Handler Specialization Pattern to split large handler file
   - Created base handler class with common utilities
   - Specialized handlers for navigation, selection, and transposition
   - Used facade pattern to maintain backward compatibility
   - Improved code organization and maintainability

## 🚀 Future Structure Additions

As the project evolves, the following additions are planned:

1. **Language Provider System**
   - `src/languages/` directory for language-specific providers
   - `language-detector.ts` for detecting active language
   - Language providers for different programming languages

2. **Additional Features**
   - New feature modules following the established pattern
   - Support for multiple languages in existing features
   - Advanced capabilities like scope visualization

3. **Configuration System**
   - Enhanced settings for language-specific behaviors
   - User-configurable language mappings and preferences
