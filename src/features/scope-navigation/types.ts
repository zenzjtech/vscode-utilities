import * as vscode from 'vscode';
import { ScopeInfo } from '../scope-deletion/types';

/**
 * Interface for scope navigation results
 */
export interface ScopeNavigationResult {
  success: boolean;
  message: string;
  targetPosition?: vscode.Position;
  targetScopeInfo?: ScopeInfo;
}

/**
 * Navigation direction for scope navigation
 */
export enum NavigationDirection {
  Forward = 'forward',
  Backward = 'backward'
}
