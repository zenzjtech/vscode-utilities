# VS Code UI Enhancer Extension Entrypoints

## Main Extension Entrypoints

### Extension Entry
- **File**: `src/extension.ts`
- **Function**: `activate(context: vscode.ExtensionContext)`
- **Description**: Main entry point for the extension, called when the extension is activated.

### Extension Commands
1. **Hello World Command**
   - **Command ID**: `ui-enhancer.helloWorld`
   - **Implementation**: Shows a simple "Hello World" message, primarily for testing.

2. **Enhance Scroll UI Command**
   - **Command ID**: `ui-enhancer.enhanceScrollUI`
   - **Implementation**: Toggles the enhanced scrollbar UI feature (thin scrollbars with rounded corners).
   - **File**: `src/extension.ts`
   - **Function**: The command is registered in the `activate` function and calls `enableEnhancedScrollUI` or `disableEnhancedScrollUI` based on current state.

## Build Process Entrypoints

### Webpack Build
- **Entry File**: `webpack.config.js`
- **Main Script**: Defined in `package.json` under the `main` field as `./dist/extension.js`

### NPM Scripts
- **Compile**: `npm run compile` - Builds the extension using webpack
- **Watch**: `npm run watch` - Builds the extension and watches for changes
- **Package**: `npm run package` - Prepares the extension for publishing
