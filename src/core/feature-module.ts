import * as vscode from 'vscode';
import { CommandRegistry } from './command-registry';

/**
 * Base abstract class for all feature modules in the extension.
 * Each feature module encapsulates a specific functionality and is responsible
 * for registering its commands and managing its lifecycle.
 */
export abstract class FeatureModule {
  /**
   * Array of disposables associated with this feature module
   */
  protected disposables: vscode.Disposable[] = [];

  /**
   * Constructor for the feature module
   * @param commandRegistry The command registry service for registering commands
   * @param name The name of the feature module (for logging and identification)
   */
  constructor(
    protected readonly commandRegistry: CommandRegistry,
    protected readonly name: string
  ) {}

  /**
   * Register all commands associated with this feature module.
   * This method should be implemented by subclasses to register
   * their specific commands with the command registry.
   */
  abstract register(): void;

  /**
   * Activate the feature module. This method is called during extension
   * activation and should perform any necessary initialization.
   */
  activate(): void {
    console.log(`[Feature Module] Activating '${this.name}'`);
  }

  /**
   * Deactivate the feature module. This method is called during extension
   * deactivation and should perform any necessary cleanup.
   */
  deactivate(): void {
    console.log(`[Feature Module] Deactivating '${this.name}'`);
    this.dispose();
  }

  /**
   * Add a disposable to this feature module's collection
   * @param disposable The disposable to add
   */
  protected addDisposable(disposable: vscode.Disposable): void {
    this.disposables.push(disposable);
  }

  /**
   * Get the name of this feature module
   * @returns The feature module's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Dispose all registered disposables
   */
  dispose(): void {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
