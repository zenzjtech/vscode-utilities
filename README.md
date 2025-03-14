# UI Enhancer for VS Code

A Visual Studio Code extension that enhances the user interface with sleek customizations.

## Features

### Enhanced Scrollbars

This extension provides customized scrollbars that are:
- **Thinner** (50% of default width)
- **Rounded corners** for a modern look
- Maintains VS Code's native coloring for consistency

![Enhanced Scrollbars](images/scrollbar-comparison.png)

## Installation

1. Install this extension from the VS Code Marketplace
2. Install the "Custom CSS and JS Loader" extension (by be5invis)
3. Configure the custom CSS loader as described below

## Configuration

After installing this extension, you need to:

1. Run the command `UI Enhancer: Apply Thin Rounded Scrollbars` from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Follow the prompts to install the "Custom CSS and JS Loader" extension if you haven't already
3. Click "Show Configuration" to see the required settings
4. Add the provided CSS path to your settings.json under the `vscode_custom_css.imports` setting
5. Run the "Reload Custom CSS and JS" command and restart VS Code when prompted

## Toggle On/Off

You can toggle the enhanced scrollbars on and off at any time:

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Run the command `UI Enhancer: Apply Thin Rounded Scrollbars` again to toggle the feature

## Requirements

- Visual Studio Code v1.54.0 or higher
- "Custom CSS and JS Loader" extension (be5invis.vscode-custom-css)

## Extension Settings

This extension doesn't add any direct settings to VS Code. Instead, it works with the "Custom CSS and JS Loader" extension to apply the UI enhancements.

## Known Issues

- The extension requires a separate "Custom CSS and JS Loader" extension due to VS Code's limitations on directly modifying the UI
- On some platforms, administrative privileges may be required for the Custom CSS Loader to function

## Release Notes

### 0.0.1

- Initial release
- Added thin (50%) scrollbars with rounded corners

---

**Enjoy!**
