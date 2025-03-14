import * as vscode from 'vscode';
import { SexpNavigatorFactory } from './finders';
import { SexpNavigationUiUtils } from './ui-utils';
import { SexpBoundary } from './types';

/**
 * Handlers for sexp navigation commands
 */
export class SexpNavigationHandlers {
  
  /**
   * Handles the forward sexp navigation command
   * Moves the cursor to the end of the next balanced expression
   * @param editor The text editor
   */
  public async handleForwardSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    const sexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (sexpBoundary) {
      // Use enhanced visual feedback
      SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
        editor,
        sexpBoundary,
        'forward',
        position
      );
      
      // Move the cursor to the end position of the expression
      const newPosition = new vscode.Position(sexpBoundary.endLine, sexpBoundary.endChar);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      
      // Ensure the new position is visible
      editor.revealRange(
        new vscode.Range(newPosition, newPosition),
        vscode.TextEditorRevealType.Default
      );
    }
  }
  
  /**
   * Handles the backward sexp navigation command
   * Moves the cursor to the beginning of the previous balanced expression
   * @param editor The text editor
   */
  public async handleBackwardSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    const sexpBoundary = navigator.findBackwardSexp(editor.document, position);
    
    if (sexpBoundary) {
      // Use enhanced visual feedback
      SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
        editor,
        sexpBoundary,
        'backward',
        position
      );
      
      // Move the cursor to the start position of the expression
      const newPosition = new vscode.Position(sexpBoundary.startLine, sexpBoundary.startChar);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      
      // Ensure the new position is visible
      editor.revealRange(
        new vscode.Range(newPosition, newPosition),
        vscode.TextEditorRevealType.Default
      );
    }
  }

  /**
   * Handles the mark sexp command
   * Selects the current or next balanced expression
   * @param editor The text editor
   */
  public async handleMarkSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the boundary of the current or next expression
    const sexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (sexpBoundary) {
      this.selectSexpression(editor, sexpBoundary, 'mark', position);
    }
  }

  /**
   * Handles the mark parent sexp command
   * Finds and selects the parent balanced expression that contains the cursor
   * @param editor The text editor
   */
  public async handleMarkParentSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the parent expression that contains the current position
    const parentSexpBoundary = this.findParentSexpression(editor.document, position, navigator);
    
    if (parentSexpBoundary) {
      this.selectSexpression(editor, parentSexpBoundary, 'mark-parent', position);
    }
  }

  /**
   * Handles the expand sexp selection command
   * Expands the current selection to include the parent expression
   * @param editor The text editor
   */
  public async handleExpandSexpSelection(editor: vscode.TextEditor): Promise<void> {
    const selection = editor.selection;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // If there's already a selection, try to find a parent that fully contains it
    const startPos = selection.start;
    const endPos = selection.end;
    
    // Create a boundary representing the current selection
    const currentSelectionBoundary: SexpBoundary = {
      startLine: startPos.line,
      startChar: startPos.character,
      endLine: endPos.line,
      endChar: endPos.character
    };
    
    // Find a parent expression that fully contains the current selection
    const parentSexpBoundary = this.findParentSexpression(
      editor.document, 
      startPos, 
      navigator, 
      currentSelectionBoundary
    );
    
    if (parentSexpBoundary) {
      this.selectSexpression(editor, parentSexpBoundary, 'expand', startPos);
    }
  }

  /**
   * Handles the transpose sexp command
   * Swaps the current S-expression with the next one
   * @param editor The text editor
   */
  public async handleTransposeSexp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the boundary of the current expression
    const currentSexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (!currentSexpBoundary) {
      vscode.window.showWarningMessage('No S-expression found at the current position');
      return;
    }
    
    // Find the boundary of the next expression
    const nextPosition = new vscode.Position(currentSexpBoundary.endLine, currentSexpBoundary.endChar);
    const nextSexpBoundary = navigator.findForwardSexp(editor.document, nextPosition);
    
    if (!nextSexpBoundary) {
      vscode.window.showWarningMessage('No next S-expression found to transpose with');
      return;
    }
    
    // Perform the transposition
    await this.transposeSexpressions(editor, currentSexpBoundary, nextSexpBoundary);
  }

  /**
   * Handles the move sexp up command
   * Moves the current S-expression up in a list (swapping with the previous sibling)
   * @param editor The text editor
   */
  public async handleMoveSexpUp(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the nearest list context (parent expression that's a list)
    const parentBoundary = this.findParentSexpression(editor.document, position, navigator);
    
    if (!parentBoundary) {
      vscode.window.showWarningMessage('Could not find a parent expression to move within');
      return;
    }
    
    // Find the current expression
    const currentSexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (!currentSexpBoundary) {
      vscode.window.showWarningMessage('No S-expression found at the current position');
      return;
    }
    
    // Find the previous sibling expression
    const previousSibling = this.findPreviousSibling(
      editor.document, 
      currentSexpBoundary, 
      parentBoundary, 
      navigator
    );
    
    if (!previousSibling) {
      vscode.window.showWarningMessage('No previous S-expression found to move before');
      return;
    }
    
    // Perform the transposition with the previous sibling
    await this.transposeSexpressions(editor, previousSibling, currentSexpBoundary);
  }

  /**
   * Handles the move sexp down command
   * Moves the current S-expression down in a list (swapping with the next sibling)
   * @param editor The text editor
   */
  public async handleMoveSexpDown(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const navigator = SexpNavigatorFactory.getNavigator(editor.document.languageId);
    
    // Find the current expression
    const currentSexpBoundary = navigator.findForwardSexp(editor.document, position);
    
    if (!currentSexpBoundary) {
      vscode.window.showWarningMessage('No S-expression found at the current position');
      return;
    }
    
    // Find the next sibling expression
    const nextPosition = new vscode.Position(currentSexpBoundary.endLine, currentSexpBoundary.endChar);
    const nextSibling = navigator.findForwardSexp(editor.document, nextPosition);
    
    if (!nextSibling) {
      vscode.window.showWarningMessage('No next S-expression found to move after');
      return;
    }
    
    // Perform the transposition with the next sibling
    await this.transposeSexpressions(editor, currentSexpBoundary, nextSibling);
  }

  /**
   * Selects an S-expression and provides visual feedback
   * @param editor The text editor
   * @param boundary The boundary of the expression to select
   * @param action The type of action being performed ('mark', 'mark-parent', or 'expand')
   * @param originalPosition The original cursor position
   */
  private selectSexpression(
    editor: vscode.TextEditor,
    boundary: SexpBoundary,
    action: 'mark' | 'mark-parent' | 'expand',
    originalPosition: vscode.Position
  ): void {
    // Create a range for the S-expression
    const range = new vscode.Range(
      boundary.startLine,
      boundary.startChar,
      boundary.endLine,
      boundary.endChar
    );
    
    // Update the selection
    editor.selection = new vscode.Selection(
      boundary.startLine,
      boundary.startChar,
      boundary.endLine,
      boundary.endChar
    );
    
    // Ensure the selection is visible
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    
    // Get the text of the expression for display and clipboard
    const selectedText = editor.document.getText(range);
    
    // Check if we should automatically copy to clipboard
    const config = vscode.workspace.getConfiguration('vscodeUtilities');
    if (config.get<boolean>('copyToClipboard')) {
      vscode.env.clipboard.writeText(selectedText);
    }
    
    // Provide visual feedback
    SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
      editor,
      boundary,
      action === 'mark' ? 'forward' : 'backward', // Use direction for appropriate styling
      originalPosition
    );
    
    // Show a notification with the action type
    let message = '';
    switch (action) {
      case 'mark':
        message = 'Selected S-expression';
        break;
      case 'mark-parent':
        message = 'Selected parent S-expression';
        break;
      case 'expand':
        message = 'Expanded selection to parent S-expression';
        break;
    }
    
    // Determine the size of the selection for the message
    const lineCount = boundary.endLine - boundary.startLine + 1;
    const charCount = selectedText.length;
    
    // Show a detailed message with copy confirmation if appropriate
    if (config.get<boolean>('copyToClipboard')) {
      vscode.window.setStatusBarMessage(
        `${message} (${lineCount} lines, ${charCount} chars) - Copied to clipboard`, 
        3000
      );
    } else {
      vscode.window.setStatusBarMessage(
        `${message} (${lineCount} lines, ${charCount} chars)`, 
        3000
      );
    }
  }

  /**
   * Transposes two S-expressions by swapping their text content
   * @param editor The text editor
   * @param firstBoundary The boundary of the first expression
   * @param secondBoundary The boundary of the second expression
   */
  private async transposeSexpressions(
    editor: vscode.TextEditor,
    firstBoundary: SexpBoundary, 
    secondBoundary: SexpBoundary
  ): Promise<void> {
    // Create ranges for both expressions
    const firstRange = new vscode.Range(
      firstBoundary.startLine, 
      firstBoundary.startChar,
      firstBoundary.endLine,
      firstBoundary.endChar
    );
    
    const secondRange = new vscode.Range(
      secondBoundary.startLine,
      secondBoundary.startChar,
      secondBoundary.endLine,
      secondBoundary.endChar
    );
    
    // Get the text of both expressions
    const firstText = editor.document.getText(firstRange);
    const secondText = editor.document.getText(secondRange);
    
    // Check if there's whitespace between expressions that should be preserved
    const spaceBetween = this.getSpaceBetween(editor.document, firstBoundary, secondBoundary);
    
    // Provide visual feedback before the transposition
    SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
      editor,
      firstBoundary,
      'forward',
      new vscode.Position(firstBoundary.startLine, firstBoundary.startChar)
    );
    
    SexpNavigationUiUtils.highlightSexpWithEnhancedFeedback(
      editor,
      secondBoundary,
      'backward',
      new vscode.Position(secondBoundary.startLine, secondBoundary.startChar)
    );
    
    // Perform the swap in a single edit
    await editor.edit(editBuilder => {
      // If the expressions are adjacent with no whitespace between them
      if (!spaceBetween) {
        editBuilder.replace(firstRange, secondText);
        editBuilder.replace(secondRange, firstText);
      } else {
        // We need to handle the case where there's whitespace between expressions
        // Create a range that includes both expressions and the space between
        const combinedRange = new vscode.Range(
          firstBoundary.startLine,
          firstBoundary.startChar,
          secondBoundary.endLine,
          secondBoundary.endChar
        );
        
        // Replace with the transposed text
        editBuilder.replace(combinedRange, secondText + spaceBetween + firstText);
      }
    });
    
    // Adjust cursor position to the start of the second expression (now in first position)
    const newPosition = new vscode.Position(firstBoundary.startLine, firstBoundary.startChar);
    editor.selection = new vscode.Selection(newPosition, newPosition);
    
    // Ensure the edited text is visible
    editor.revealRange(
      new vscode.Range(firstBoundary.startLine, firstBoundary.startChar, secondBoundary.endLine, secondBoundary.endChar),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport
    );
    
    // Show a status message
    vscode.window.setStatusBarMessage('Transposed S-expressions', 3000);
  }

  /**
   * Gets the text between two expression boundaries
   * @param document The text document
   * @param first The first expression boundary
   * @param second The second expression boundary
   * @returns The text between the expressions, or null if they're adjacent
   */
  private getSpaceBetween(
    document: vscode.TextDocument,
    first: SexpBoundary,
    second: SexpBoundary
  ): string | null {
    // Check if they're on the same line and adjacent
    if (first.endLine === second.startLine && first.endChar === second.startChar) {
      return null;
    }
    
    // Check if they're on different lines
    if (first.endLine !== second.startLine) {
      let spaceBetween = '';
      
      // Get the rest of the first line
      const firstLineText = document.lineAt(first.endLine).text;
      spaceBetween += firstLineText.substring(first.endChar);
      
      // Get any lines in between
      for (let line = first.endLine + 1; line < second.startLine; line++) {
        spaceBetween += '\n' + document.lineAt(line).text;
      }
      
      // Get the beginning of the second line
      if (first.endLine !== second.startLine) {
        const secondLineText = document.lineAt(second.startLine).text;
        spaceBetween += '\n' + secondLineText.substring(0, second.startChar);
      }
      
      return spaceBetween;
    }
    
    // They're on the same line but not adjacent
    const lineText = document.lineAt(first.endLine).text;
    return lineText.substring(first.endChar, second.startChar);
  }

  /**
   * Finds the previous sibling expression within the same parent
   * @param document The text document
   * @param currentBoundary The current expression boundary
   * @param parentBoundary The parent expression boundary
   * @param navigator The S-expression navigator
   * @returns The boundary of the previous sibling, or undefined if none found
   */
  private findPreviousSibling(
    document: vscode.TextDocument,
    currentBoundary: SexpBoundary,
    parentBoundary: SexpBoundary,
    navigator: any
  ): SexpBoundary | undefined {
    // Start from the beginning of the parent and find all siblings
    const parentStartPos = new vscode.Position(parentBoundary.startLine, parentBoundary.startChar);
    
    // Position just after the opening delimiter of the parent (list)
    let searchPos = new vscode.Position(
      parentBoundary.startLine, 
      parentBoundary.startChar + 1
    );
    
    // Keep track of the last sibling found before the current one
    let lastSibling: SexpBoundary | undefined;
    
    // Iterate through siblings until we reach the current one
    while (searchPos.isBefore(new vscode.Position(currentBoundary.startLine, currentBoundary.startChar))) {
      const siblingBoundary = navigator.findForwardSexp(document, searchPos);
      
      if (!siblingBoundary) {
        break;
      }
      
      // Check if this sibling is inside the parent and before the current expression
      const siblingStartPos = new vscode.Position(siblingBoundary.startLine, siblingBoundary.startChar);
      const siblingEndPos = new vscode.Position(siblingBoundary.endLine, siblingBoundary.endChar);
      
      if (siblingEndPos.isBefore(new vscode.Position(currentBoundary.startLine, currentBoundary.startChar))) {
        lastSibling = siblingBoundary;
      }
      
      // Move to the position after this sibling
      searchPos = new vscode.Position(siblingBoundary.endLine, siblingBoundary.endChar);
      
      // Safety check to prevent infinite loops
      if (searchPos.isEqual(new vscode.Position(currentBoundary.startLine, currentBoundary.startChar))) {
        break;
      }
    }
    
    return lastSibling;
  }

  /**
   * Finds the parent S-expression that contains the given position
   * @param document The text document
   * @param position The position to find a parent for
   * @param navigator The S-expression navigator
   * @param currentBoundary Optional boundary to exclude (to find a larger parent)
   * @returns The boundary of the parent expression, or undefined if none found
   */
  private findParentSexpression(
    document: vscode.TextDocument,
    position: vscode.Position,
    navigator: any,
    currentBoundary?: SexpBoundary
  ): SexpBoundary | undefined {
    // Scan backward until we find a start character of a balanced expression
    const lineCount = document.lineCount;
    let currentLine = position.line;
    let currentChar = position.character;
    
    // Start from the beginning of the file and look for balanced pairs
    // that contain our position
    let potentialParents: SexpBoundary[] = [];
    
    // Simplified approach: check each line for potential opening delimiters
    for (let line = 0; line < lineCount; line++) {
      const lineText = document.lineAt(line).text;
      
      // Look for opening delimiters: (, [, {
      for (let char = 0; char < lineText.length; char++) {
        const currentChar = lineText.charAt(char);
        if (currentChar === '(' || currentChar === '[' || currentChar === '{') {
          // Try to find a matching boundary that starts at this position
          const checkPosition = new vscode.Position(line, char);
          const boundary = navigator.findForwardSexp(document, checkPosition);
          
          if (boundary) {
            // Check if this boundary fully contains our position
            const boundaryRange = new vscode.Range(
              boundary.startLine, boundary.startChar,
              boundary.endLine, boundary.endChar
            );
            
            const positionRange = new vscode.Range(position, position);
            
            if (boundaryRange.contains(position)) {
              // This is a potential parent
              potentialParents.push(boundary);
            }
          }
        }
      }
    }
    
    // If we're looking for a parent of a current boundary, filter out boundaries that are too small
    if (currentBoundary) {
      potentialParents = potentialParents.filter(parent => {
        // Check if parent fully contains the current boundary
        return (
          (parent.startLine < currentBoundary.startLine || 
           (parent.startLine === currentBoundary.startLine && parent.startChar <= currentBoundary.startChar)) &&
          (parent.endLine > currentBoundary.endLine || 
           (parent.endLine === currentBoundary.endLine && parent.endChar >= currentBoundary.endChar))
        );
      });
    }
    
    // Find the smallest valid parent
    let smallestParent: SexpBoundary | undefined;
    
    for (const parent of potentialParents) {
      if (!smallestParent || this.isSmallerBoundary(parent, smallestParent)) {
        smallestParent = parent;
      }
    }
    
    return smallestParent;
  }

  /**
   * Determines if boundaryA is smaller (more specific) than boundaryB
   * @param boundaryA The first boundary
   * @param boundaryB The second boundary
   * @returns True if boundaryA is smaller than boundaryB
   */
  private isSmallerBoundary(boundaryA: SexpBoundary, boundaryB: SexpBoundary): boolean {
    // Calculate the size of each boundary
    const sizeA = this.calculateBoundarySize(boundaryA);
    const sizeB = this.calculateBoundarySize(boundaryB);
    
    return sizeA < sizeB;
  }

  /**
   * Calculates a size metric for a boundary (for comparison)
   * @param boundary The boundary to calculate size for
   * @returns A number representing the relative size
   */
  private calculateBoundarySize(boundary: SexpBoundary): number {
    // Use line difference as primary metric, character difference as secondary
    const lineSize = (boundary.endLine - boundary.startLine) * 1000;
    const charSize = boundary.endChar - boundary.startChar;
    
    return lineSize + charSize;
  }
}
