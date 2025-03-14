import * as vscode from 'vscode';
import { SexpBoundary } from './types';

/**
 * UI utilities for sexp navigation
 */
export class SexpNavigationUiUtils {
  // Default highlight duration in milliseconds
  private static readonly DEFAULT_HIGHLIGHT_DURATION = 600;
  
  // Animation frames for path indication
  private static readonly ANIMATION_FRAMES = 8;
  
  /**
   * Shows a status bar message indicating the type of sexp navigation
   * @param direction The direction of navigation ('forward' or 'backward')
   * @param expressionType The type of expression navigated (e.g., 'function call', 'object', 'array', etc.)
   */
  public static showNavigationMessage(direction: 'forward' | 'backward', expressionType?: string): void {
    const actionMessage = direction === 'forward' ? 'Forward' : 'Backward';
    const typeInfo = expressionType ? ` (${expressionType})` : '';
    vscode.window.setStatusBarMessage(`${actionMessage} S-expression${typeInfo}`, 2000);
  }
  
  /**
   * Creates a decoration type for highlighting the target sexp
   * @param isSource Whether this is highlighting the source position
   * @param isDestination Whether this is highlighting the destination position
   * @returns A text editor decoration type
   */
  public static getHighlightDecoration(isSource = false, isDestination = false): vscode.TextEditorDecorationType {
    // Different styles for source, destination, and path
    if (isSource) {
      return vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
        borderRadius: '3px',
        border: '1px solid',
        borderColor: new vscode.ThemeColor('editorWarning.foreground'),
        opacity: '0.6'
      });
    } else if (isDestination) {
      return vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
        borderRadius: '3px',
        border: '2px solid',
        borderColor: new vscode.ThemeColor('editorInfo.foreground'),
        opacity: '0.9'
      });
    } else {
      return vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
        borderRadius: '3px',
        border: '1px solid',
        borderColor: new vscode.ThemeColor('editor.findMatchHighlightBorder'),
      });
    }
  }
  
  /**
   * Get the direction indicator decoration for showing the path of navigation
   * @param direction The direction of navigation ('forward' or 'backward')
   * @param frameIndex The current animation frame index
   * @returns A text editor decoration type for the direction indicator
   */
  private static getDirectionIndicatorDecoration(
    direction: 'forward' | 'backward',
    frameIndex: number
  ): vscode.TextEditorDecorationType {
    // Animation intensity based on frame index (0-1 range)
    const intensity = Math.sin((frameIndex / this.ANIMATION_FRAMES) * Math.PI);
    const opacity = 0.3 + (intensity * 0.6);
    
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor(
        direction === 'forward' ? 'editorInfo.foreground' : 'editorWarning.foreground'
      ),
      borderRadius: '2px',
      opacity: opacity.toString(),
      border: 'none'
    });
  }
  
  /**
   * Gets the appropriate highlight duration from configuration or uses default
   * @returns Duration in milliseconds for the highlight to stay visible
   */
  private static getHighlightDuration(): number {
    const config = vscode.workspace.getConfiguration('vscodeUtilities');
    return config.get<number>('sexpNavigationHighlightDuration') || this.DEFAULT_HIGHLIGHT_DURATION;
  }
  
  /**
   * Determine if enhanced animation is enabled in settings
   * @returns Whether enhanced animation is enabled
   */
  private static isEnhancedAnimationEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('vscodeUtilities');
    return config.get<boolean>('enhancedSexpNavigationAnimation') !== false; // Default to true if not set
  }
  
  /**
   * Get expression type label for more informative feedback
   * @param editor The text editor
   * @param boundary The boundary of the expression
   * @returns A human-readable label for the expression type
   */
  private static getExpressionTypeLabel(
    editor: vscode.TextEditor,
    boundary: SexpBoundary
  ): string {
    const startPos = new vscode.Position(boundary.startLine, boundary.startChar);
    const endPos = new vscode.Position(boundary.endLine, boundary.endChar);
    const expressionText = editor.document.getText(new vscode.Range(startPos, endPos));
    
    // Simple heuristic to determine expression type
    if (expressionText.startsWith('(') && expressionText.endsWith(')')) {
      return 'parentheses';
    } else if (expressionText.startsWith('[') && expressionText.endsWith(']')) {
      return 'array';
    } else if (expressionText.startsWith('{') && expressionText.endsWith('}')) {
      return 'object';
    } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expressionText)) {
      return 'identifier';
    } else if (/^["'].*["']$/.test(expressionText)) {
      return 'string';
    } else {
      return 'expression';
    }
  }
  
  /**
   * Highlights the target sexp with enhanced visual feedback
   * @param editor The text editor
   * @param boundary The boundary of the sexp to highlight
   * @param direction The direction of navigation ('forward' or 'backward')
   * @param startPosition The starting cursor position
   */
  public static highlightSexpWithEnhancedFeedback(
    editor: vscode.TextEditor,
    boundary: SexpBoundary,
    direction: 'forward' | 'backward',
    startPosition: vscode.Position
  ): void {
    const useEnhancedAnimation = this.isEnhancedAnimationEnabled();
    const highlightDuration = this.getHighlightDuration();
    const expressionType = this.getExpressionTypeLabel(editor, boundary);
    
    // Show information message with expression type
    this.showNavigationMessage(direction, expressionType);
    
    // Create the main decoration for the target expression
    const targetDecoration = this.getHighlightDecoration(false, true);
    const targetRange = new vscode.Range(
      boundary.startLine,
      boundary.startChar,
      boundary.endLine,
      boundary.endChar
    );
    
    // Apply the decoration to highlight the target
    editor.setDecorations(targetDecoration, [targetRange]);
    
    // If enhanced animation is enabled, add source highlight and animated path
    if (useEnhancedAnimation) {
      // Highlight the source position
      const sourceDecoration = this.getHighlightDecoration(true, false);
      const sourceRange = new vscode.Range(startPosition, startPosition.translate(0, 1));
      editor.setDecorations(sourceDecoration, [sourceRange]);
      
      // Animate a path between source and destination
      this.animateNavigationPath(
        editor,
        startPosition,
        direction === 'forward' 
          ? new vscode.Position(boundary.endLine, boundary.endChar)
          : new vscode.Position(boundary.startLine, boundary.startChar),
        direction,
        highlightDuration
      );
      
      // Clean up the source decoration after the animation
      setTimeout(() => {
        sourceDecoration.dispose();
      }, highlightDuration);
    }
    
    // Remove the target decoration after the configured duration
    setTimeout(() => {
      targetDecoration.dispose();
    }, highlightDuration);
    
    // Also display an informative hint in the editor
    vscode.window.showInformationMessage(
      `Navigated ${direction} to ${expressionType}`,
      { modal: false }
    );
  }
  
  /**
   * Animate a path between the source and destination positions
   * @param editor The text editor
   * @param source The source position
   * @param destination The destination position
   * @param direction The direction of navigation
   * @param totalDuration The total duration of the animation
   */
  private static animateNavigationPath(
    editor: vscode.TextEditor,
    source: vscode.Position,
    destination: vscode.Position,
    direction: 'forward' | 'backward',
    totalDuration: number
  ): void {
    const frameDecorations: vscode.TextEditorDecorationType[] = [];
    const frameDuration = totalDuration / this.ANIMATION_FRAMES;
    
    // Calculate the path points between source and destination
    const createPathPoints = () => {
      const points: vscode.Position[] = [];
      const steps = this.ANIMATION_FRAMES;
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const sourceLine = source.line;
        const sourceChar = source.character;
        const destLine = destination.line;
        const destChar = destination.character;
        
        // Calculate interpolated position
        const line = Math.round(sourceLine + (destLine - sourceLine) * progress);
        const char = Math.round(sourceChar + (destChar - sourceChar) * progress);
        
        points.push(new vscode.Position(line, char));
      }
      
      return points;
    };
    
    const pathPoints = createPathPoints();
    
    // Run the animation frames
    for (let i = 0; i < this.ANIMATION_FRAMES; i++) {
      const decoration = this.getDirectionIndicatorDecoration(direction, i);
      frameDecorations.push(decoration);
      
      setTimeout(() => {
        // For each frame, create a small range at the current path point
        const point = pathPoints[i];
        const range = new vscode.Range(point, point.translate(0, 1));
        editor.setDecorations(decoration, [range]);
      }, i * frameDuration);
      
      // Clean up each frame after it completes
      setTimeout(() => {
        decoration.dispose();
      }, (i + 1) * frameDuration);
    }
  }
}
