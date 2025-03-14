import * as vscode from 'vscode';
import { SexpBoundary } from '../types';

/**
 * Base class with common utility methods for S-expression handlers
 */
export abstract class BaseSexpHandler {
  /**
   * Gets the text between two expression boundaries
   * @param document The text document
   * @param first The first expression boundary
   * @param second The second expression boundary
   * @returns The text between the expressions, or null if they're adjacent
   */
  protected getSpaceBetween(
    document: vscode.TextDocument,
    first: SexpBoundary,
    second: SexpBoundary
  ): string | null {
    // Ensure the boundaries are in order (first before second)
    const [earlier, later] = this.orderBoundaries(first, second);
    
    // If the later expression starts immediately after the earlier one ends,
    // there's no space between them
    if (earlier.endLine === later.startLine && earlier.endChar === later.startChar) {
      return null;
    }
    
    // If they're on the same line
    if (earlier.endLine === later.startLine) {
      return document.getText(new vscode.Range(
        earlier.endLine, earlier.endChar,
        later.startLine, later.startChar
      ));
    }
    
    // If they're on different lines
    return document.getText(new vscode.Range(
      earlier.endLine, earlier.endChar,
      later.startLine, later.startChar
    ));
  }

  /**
   * Finds the parent S-expression that contains the given position
   * @param document The text document
   * @param position The position to find a parent for
   * @param navigator The S-expression navigator
   * @param currentBoundary Optional boundary to exclude (to find a larger parent)
   * @returns The boundary of the parent expression, or undefined if none found
   */
  protected findParentSexpression(
    document: vscode.TextDocument,
    position: vscode.Position,
    navigator: any,
    currentBoundary?: SexpBoundary
  ): SexpBoundary | undefined {
    // Strategy: Find all expressions that contain the current position
    // and select the smallest one that's larger than currentBoundary
    
    // Start from the current line and search backward for candidate parent expressions
    let candidateParents: SexpBoundary[] = [];
    let line = position.line;
    const maxLineSearch = 50; // Limit how far we search to avoid performance issues
    
    // Search for possible parent expressions by scanning back from the current line
    while (line >= 0 && line >= position.line - maxLineSearch) {
      const lineStartPos = new vscode.Position(line, 0);
      
      // Try to find an expression starting on this line
      const possibleParent = navigator.findForwardSexp(document, lineStartPos);
      
      if (possibleParent && 
          this.boundaryContainsPosition(possibleParent, position) &&
          (!currentBoundary || !this.isSameBoundary(possibleParent, currentBoundary))) {
        candidateParents.push(possibleParent);
      }
      
      line--;
    }
    
    // If we found candidate parents, return the smallest one that contains the position
    // and is larger than currentBoundary (if provided)
    if (candidateParents.length > 0) {
      // Filter out any that are smaller than or equal to currentBoundary
      if (currentBoundary) {
        candidateParents = candidateParents.filter(parent => 
          !this.isSmallerBoundary(parent, currentBoundary) && 
          !this.isSameBoundary(parent, currentBoundary)
        );
      }
      
      // Sort by size, smallest first
      candidateParents.sort((a, b) => 
        this.calculateBoundarySize(a) - this.calculateBoundarySize(b)
      );
      
      // Return the smallest valid parent (first in the sorted array)
      return candidateParents[0];
    }
    
    return undefined;
  }

  /**
   * Determines if a boundary contains a position
   * @param boundary The expression boundary
   * @param position The position to check
   * @returns True if the boundary contains the position
   */
  protected boundaryContainsPosition(boundary: SexpBoundary, position: vscode.Position): boolean {
    const startPos = new vscode.Position(boundary.startLine, boundary.startChar);
    const endPos = new vscode.Position(boundary.endLine, boundary.endChar);
    return position.isAfterOrEqual(startPos) && position.isBeforeOrEqual(endPos);
  }

  /**
   * Orders two boundaries based on their position in the document
   * @param boundaryA The first boundary
   * @param boundaryB The second boundary
   * @returns An array with the earlier boundary first, then the later boundary
   */
  protected orderBoundaries(
    boundaryA: SexpBoundary,
    boundaryB: SexpBoundary
  ): [SexpBoundary, SexpBoundary] {
    const startA = new vscode.Position(boundaryA.startLine, boundaryA.startChar);
    const startB = new vscode.Position(boundaryB.startLine, boundaryB.startChar);
    
    if (startA.isBefore(startB)) {
      return [boundaryA, boundaryB];
    }
    return [boundaryB, boundaryA];
  }

  /**
   * Determines if boundaryA is smaller (more specific) than boundaryB
   * @param boundaryA The first boundary
   * @param boundaryB The second boundary
   * @returns True if boundaryA is smaller than boundaryB
   */
  protected isSmallerBoundary(boundaryA: SexpBoundary, boundaryB: SexpBoundary): boolean {
    return this.calculateBoundarySize(boundaryA) < this.calculateBoundarySize(boundaryB);
  }

  /**
   * Determines if two boundaries are the same
   * @param boundaryA The first boundary
   * @param boundaryB The second boundary
   * @returns True if the boundaries are the same
   */
  protected isSameBoundary(boundaryA: SexpBoundary, boundaryB: SexpBoundary): boolean {
    return boundaryA.startLine === boundaryB.startLine &&
           boundaryA.startChar === boundaryB.startChar &&
           boundaryA.endLine === boundaryB.endLine &&
           boundaryA.endChar === boundaryB.endChar;
  }

  /**
   * Calculates a size metric for a boundary (for comparison)
   * @param boundary The boundary to calculate size for
   * @returns A number representing the relative size
   */
  protected calculateBoundarySize(boundary: SexpBoundary): number {
    const startPos = new vscode.Position(boundary.startLine, boundary.startChar);
    const endPos = new vscode.Position(boundary.endLine, boundary.endChar);
    
    // If on the same line, size is just the character difference
    if (boundary.startLine === boundary.endLine) {
      return boundary.endChar - boundary.startChar;
    }
    
    // If on different lines, calculate a size based on lines and characters
    const lineCount = boundary.endLine - boundary.startLine;
    return (lineCount * 1000) + (boundary.endChar + (1000 - boundary.startChar));
  }
}
