import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerTextEditorCommand('extension.deleteCurrentScope', async (editor, edit) => {

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
            await deleteFunction(editor, edit, position);
        } else if (class_match) {
            await deleteClass(editor, edit, position);
        } else {
            // New functionality: Check if cursor is INSIDE a function or class scope
            // by analyzing the surrounding code structure
            
            // First, check if the cursor is inside a function body
            const containingFunction = findContainingFunction(document, position);
            if (containingFunction) {
                await deleteFunction(editor, edit, new vscode.Position(containingFunction.startLine, 0));
                return;
            }
            
            // Then check if cursor is inside a class
            const containingClass = findContainingClass(document, position);
            if (containingClass) {
                await deleteClass(editor, edit, new vscode.Position(containingClass.startLine, 0));
                return;
            }
            
            vscode.window.showInformationMessage("Cursor is not within a function or class scope.");
        }
    });

    // Register the new command for deleting code between brackets
    let bracketDisposable = vscode.commands.registerTextEditorCommand('extension.deleteCurrentBracketScope', async (editor, edit) => {
        await deleteBracketScope(editor, edit, editor.selection.active);
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(bracketDisposable);
}

/**
 * Deletes the content between the nearest pair of curly brackets that contain the cursor position.
 * If no containing bracket pair is found, it will try to delete the content between the next pair.
 */
async function deleteBracketScope(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position) {
    const document = editor.document;
    const cursorLine = position.line;
    const cursorPosition = position.character;
    
    // First, try to find the nearest bracket pair containing the cursor
    const bracketRange = findBracketPairContainingCursor(document, cursorLine, cursorPosition);
    
    if (bracketRange) {
        // Delete the content between brackets (excluding the brackets themselves)
        await editor.edit(editBuilder => {
            editBuilder.delete(new vscode.Range(
                bracketRange.openBracketLine, bracketRange.openBracketChar + 1, // Start after the opening bracket
                bracketRange.closeBracketLine, bracketRange.closeBracketChar // End before the closing bracket
            ));
        });
    } else {
        // If no bracket pair contains the cursor, look for the next bracket pair
        const nextBracketRange = findNextBracketPair(document, cursorLine, cursorPosition);
        
        if (nextBracketRange) {
            // Delete the content between the next bracket pair (excluding the brackets)
            await editor.edit(editBuilder => {
                editBuilder.delete(new vscode.Range(
                    nextBracketRange.openBracketLine, nextBracketRange.openBracketChar + 1, // Start after the opening bracket
                    nextBracketRange.closeBracketLine, nextBracketRange.closeBracketChar // End before the closing bracket
                ));
            });
        } else {
            vscode.window.showInformationMessage("No bracket scope found.");
        }
    }
}

/**
 * Finds the nearest pair of curly brackets that contain the cursor position.
 */
function findBracketPairContainingCursor(document: vscode.TextDocument, cursorLine: number, cursorChar: number): BracketPair | null {
    // Start from the cursor line and search backwards for the opening bracket
    let openBracketLine = -1;
    let openBracketChar = -1;
    let bracketStack = 0;
    
    // First search backwards from cursor to find a potential opening bracket
    for (let line = cursorLine; line >= 0; line--) {
        const lineText = document.lineAt(line).text;
        
        // If we're on the cursor line, only check characters before the cursor
        const endChar = line === cursorLine ? cursorChar : lineText.length;
        
        for (let char = endChar; char >= 0; char--) {
            if (lineText[char] === '}') {
                bracketStack++;
            } else if (lineText[char] === '{') {
                bracketStack--;
                
                // If we found the outermost opening bracket
                if (bracketStack === -1) {
                    openBracketLine = line;
                    openBracketChar = char;
                    break;
                }
            }
        }
        
        if (openBracketLine !== -1) {
            break;
        }
    }
    
    // Reset the stack and search forward for the matching closing bracket
    if (openBracketLine !== -1) {
        bracketStack = 1; // We found one opening bracket
        let closeBracketLine = -1;
        let closeBracketChar = -1;
        
        for (let line = openBracketLine; line < document.lineCount; line++) {
            const lineText = document.lineAt(line).text;
            
            // If we're on the opening bracket line, start searching after the opening bracket
            const startChar = line === openBracketLine ? openBracketChar + 1 : 0;
            
            for (let char = startChar; char < lineText.length; char++) {
                if (lineText[char] === '{') {
                    bracketStack++;
                } else if (lineText[char] === '}') {
                    bracketStack--;
                    
                    // If we found the matching closing bracket
                    if (bracketStack === 0) {
                        closeBracketLine = line;
                        closeBracketChar = char;
                        break;
                    }
                }
            }
            
            if (closeBracketLine !== -1) {
                break;
            }
        }
        
        // Check if the cursor is within this bracket pair
        if (closeBracketLine !== -1) {
            const isAfterOpening = cursorLine > openBracketLine || 
                                  (cursorLine === openBracketLine && cursorChar > openBracketChar);
            const isBeforeClosing = cursorLine < closeBracketLine || 
                                   (cursorLine === closeBracketLine && cursorChar < closeBracketChar);
            
            if (isAfterOpening && isBeforeClosing) {
                return {
                    openBracketLine,
                    openBracketChar,
                    closeBracketLine,
                    closeBracketChar
                };
            }
        }
    }
    
    return null;
}

/**
 * Finds the next pair of curly brackets after the cursor position.
 */
function findNextBracketPair(document: vscode.TextDocument, cursorLine: number, cursorChar: number): BracketPair | null {
    let openBracketLine = -1;
    let openBracketChar = -1;
    
    // Search for the next opening bracket from the cursor position
    for (let line = cursorLine; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;
        
        // If we're on the cursor line, start searching from the cursor position
        const startChar = line === cursorLine ? cursorChar : 0;
        
        for (let char = startChar; char < lineText.length; char++) {
            if (lineText[char] === '{') {
                openBracketLine = line;
                openBracketChar = char;
                break;
            }
        }
        
        if (openBracketLine !== -1) {
            break;
        }
    }
    
    // If we found an opening bracket, search for its matching closing bracket
    if (openBracketLine !== -1) {
        let bracketStack = 1; // We found one opening bracket
        let closeBracketLine = -1;
        let closeBracketChar = -1;
        
        for (let line = openBracketLine; line < document.lineCount; line++) {
            const lineText = document.lineAt(line).text;
            
            // If we're on the opening bracket line, start searching after the opening bracket
            const startChar = line === openBracketLine ? openBracketChar + 1 : 0;
            
            for (let char = startChar; char < lineText.length; char++) {
                if (lineText[char] === '{') {
                    bracketStack++;
                } else if (lineText[char] === '}') {
                    bracketStack--;
                    
                    // If we found the matching closing bracket
                    if (bracketStack === 0) {
                        closeBracketLine = line;
                        closeBracketChar = char;
                        break;
                    }
                }
            }
            
            if (closeBracketLine !== -1) {
                break;
            }
        }
        
        if (closeBracketLine !== -1) {
            return {
                openBracketLine,
                openBracketChar,
                closeBracketLine,
                closeBracketChar
            };
        }
    }
    
    return null;
}

// Interface for bracket pair positions
interface BracketPair {
    openBracketLine: number;
    openBracketChar: number;
    closeBracketLine: number;
    closeBracketChar: number;
}

async function deleteFunction(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position) {
    const document = editor.document;
    let start_line = position.line;
    const indentation = document.lineAt(start_line).firstNonWhitespaceCharacterIndex;
    let open_brace_count = 0;
    let close_brace_count = 0;
    let end_line = start_line;
    
    // Check if this is an arrow function that uses curly braces or not
    const line_text = document.lineAt(start_line).text;
    const is_arrow_function = /=>/.test(line_text);
    const arrow_without_braces = is_arrow_function && !/{/.test(line_text);
    
    if (arrow_without_braces) {
        // For arrow functions without braces, just delete the line
        await editor.edit(editBuilder => editBuilder.delete(new vscode.Range(start_line, 0, start_line + 1, 0)));
        return;
    }
    
    // Find the opening brace for methods that have types or parameters across multiple lines
    let found_opening_brace = line_text.includes('{');
    let current_line = start_line;
    
    while (!found_opening_brace && current_line < document.lineCount - 1) {
        current_line++;
        const next_line_text = document.lineAt(current_line).text;
        if (next_line_text.includes('{')) {
            found_opening_brace = true;
            // Don't update start_line - we want to delete from the method declaration
        }
        
        // If we exceed reasonable method declaration length, abort search
        if (current_line > start_line + 5) {
            break;
        }
    }

    while (true) {
        const line_text = document.lineAt(end_line).text;
        open_brace_count += (line_text.match(/{/g) || []).length;
        close_brace_count += (line_text.match(/}/g) || []).length;

        if (open_brace_count > 0 && open_brace_count === close_brace_count && getIndentation(document.lineAt(end_line).text) <= indentation && end_line > start_line) {
            break;
        }

        if (end_line === document.lineCount - 1) {
            break;
        }

        end_line++;
    }

    await editor.edit(editBuilder => editBuilder.delete(new vscode.Range(start_line, 0, end_line + 1, 0)));
}

async function deleteClass(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, position: vscode.Position) {
    const document = editor.document;
    let start_line = position.line;
    const indentation = document.lineAt(start_line).firstNonWhitespaceCharacterIndex;
    let open_brace_count = 0;
    let close_brace_count = 0;
    let end_line = start_line;

    while (true) {
        const line_text = document.lineAt(end_line).text;
        open_brace_count += (line_text.match(/{/g) || []).length;
        close_brace_count += (line_text.match(/}/g) || []).length;

        if (open_brace_count > 0 && open_brace_count === close_brace_count && getIndentation(document.lineAt(end_line).text) <= indentation && end_line > start_line) {
            break;
        }

        if (end_line === document.lineCount - 1) {
            break;
        }

        end_line++;
    }

    await editor.edit(editBuilder => editBuilder.delete(new vscode.Range(start_line, 0, end_line + 1, 0)));
}

function getIndentation(line: string) {
    return line.length - line.trimStart().length;
}

/**
 * Finds a function that contains the given position.
 * @returns An object with startLine property if found, or null if not found
 */
function findContainingFunction(document: vscode.TextDocument, position: vscode.Position): { startLine: number } | null {
    const currentLine = position.line;
    
    // Initialize bracket count to zero
    let bracketBalance = 0;
    let foundStartLine = -1;
    
    // Search backward from current line to find potential function start
    for (let line = currentLine; line >= 0; line--) {
        const lineText = document.lineAt(line).text;
        
        // Count brackets in current line
        const openBrackets = (lineText.match(/{/g) || []).length;
        const closeBrackets = (lineText.match(/}/g) || []).length;
        
        // Update bracket balance
        bracketBalance += closeBrackets;
        bracketBalance -= openBrackets;
        
        // If we have more closing than opening brackets so far
        if (bracketBalance > 0) {
            // Check if this line looks like a function declaration
            const isFunctionDeclaration = 
                /function\s+\w+\s*\(/.test(lineText) || 
                /\w+\s*\(\s*.*\s*\)\s*(\{|=>)/.test(lineText) || 
                /^(const|let|var)\s+\w+\s*=\s*(async\s*)?\(\s*.*\s*\)\s*=>/.test(lineText) ||
                /(async\s+)?[\w_$]+\s*\(.*\)\s*(\{|=>)/.test(lineText); // Method or function
            
            if (isFunctionDeclaration) {
                foundStartLine = line;
                break;
            }
            
            // If we found a potential end of an enclosing block that's not a function
            // Reset the bracket balance and continue
            if (lineText.trimEnd().endsWith('}')) {
                bracketBalance = 0;
            }
        }
        
        // If we find an opening brace with potential function declaration
        if (lineText.includes('{')) {
            const beforeBrace = lineText.substring(0, lineText.indexOf('{'));
            const isFunctionDeclaration = 
                /function\s+\w+\s*\(/.test(beforeBrace) || 
                /\w+\s*\(\s*.*\s*\)/.test(beforeBrace) || 
                /^(const|let|var)\s+\w+\s*=\s*(async\s*)?\(\s*.*\s*\)\s*=>/.test(beforeBrace) ||
                /(async\s+)?[\w_$]+\s*\(.*\)/.test(beforeBrace); // Method or function
            
            if (isFunctionDeclaration && bracketBalance <= 0) {
                foundStartLine = line;
                break;
            }
        }
    }
    
    // If we found a function declaration
    if (foundStartLine >= 0) {
        return { startLine: foundStartLine };
    }
    
    return null;
}

/**
 * Finds a class that contains the given position.
 * @returns An object with startLine property if found, or null if not found
 */
function findContainingClass(document: vscode.TextDocument, position: vscode.Position): { startLine: number } | null {
    const currentLine = position.line;
    
    // Initialize bracket count to zero
    let bracketBalance = 0;
    let foundStartLine = -1;
    
    // Search backward from current line to find potential class start
    for (let line = currentLine; line >= 0; line--) {
        const lineText = document.lineAt(line).text;
        
        // Count brackets in current line
        const openBrackets = (lineText.match(/{/g) || []).length;
        const closeBrackets = (lineText.match(/}/g) || []).length;
        
        // Update bracket balance
        bracketBalance += closeBrackets;
        bracketBalance -= openBrackets;
        
        // If we have more closing than opening brackets so far
        if (bracketBalance > 0) {
            // Check if this line looks like a class declaration
            const isClassDeclaration = /class\s+\w+/.test(lineText);
            
            if (isClassDeclaration) {
                foundStartLine = line;
                break;
            }
            
            // If we found a potential end of an enclosing block that's not a class
            // Reset the bracket balance and continue
            if (lineText.trimEnd().endsWith('}')) {
                bracketBalance = 0;
            }
        }
        
        // If we find an opening brace with potential class declaration
        if (lineText.includes('{')) {
            const beforeBrace = lineText.substring(0, lineText.indexOf('{'));
            const isClassDeclaration = /class\s+\w+/.test(beforeBrace);
            
            if (isClassDeclaration && bracketBalance <= 0) {
                foundStartLine = line;
                break;
            }
        }
    }
    
    // If we found a class declaration
    if (foundStartLine >= 0) {
        return { startLine: foundStartLine };
    }
    
    return null;
}