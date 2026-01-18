import { ErrorCategory } from '../enums/error-category.enum.js';
import { UnipileError, type ErrorContext } from './unipile.error.js';

/**
 * Error thrown when a resource is not found (HTTP 404).
 */
export class NotFoundError extends UnipileError {
  /** Type of resource that was not found */
  public readonly resourceType?: string;

  /** Identifier of the resource */
  public readonly resourceId?: string;

  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string,
    context: ErrorContext = {},
  ) {
    super(message, ErrorCategory.NOT_FOUND, context, false);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  /**
   * Creates a JSON representation including resource details.
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}
