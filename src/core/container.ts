/**
 * A lightweight dependency injection container for managing service instances.
 * This container allows for loose coupling between components by providing
 * a central registry for services.
 */
export class ServiceContainer {
  /**
   * Map of service IDs to their instances
   */
  private services: Map<string, any> = new Map();

  /**
   * Register a service instance with the container
   * @param id Unique identifier for the service
   * @param instance The service instance to register
   */
  register<T>(id: string, instance: T): void {
    if (this.services.has(id)) {
      console.warn(`Service '${id}' is already registered. Overwriting previous registration.`);
    }
    this.services.set(id, instance);
  }

  /**
   * Retrieve a service instance by ID
   * @param id Unique identifier for the service
   * @returns The service instance, or undefined if not found
   */
  get<T>(id: string): T | undefined {
    return this.services.get(id) as T | undefined;
  }

  /**
   * Check if a service is registered
   * @param id Service identifier to check
   * @returns true if service is registered, false otherwise
   */
  has(id: string): boolean {
    return this.services.has(id);
  }

  /**
   * Remove a service from the container
   * @param id Unique identifier for the service to remove
   * @returns true if the service was found and removed, false otherwise
   */
  remove(id: string): boolean {
    return this.services.delete(id);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.services.clear();
  }
}

/**
 * Global container instance for application-wide service management
 */
export const container = new ServiceContainer();
