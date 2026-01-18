import { ErrorCategory } from '../enums/error-category.enum.js';
import { UnipileError, type ErrorContext } from './unipile.error.js';

/**
 * Validation error details.
 */
export interface ValidationErrorDetail {
  /** Field that failed validation */
  field: string;

  /** Validation error message */
  message: string;

  /** Invalid value (if available) */
  value?: unknown;
}

/**
 * Error thrown for request validation failures.
 */
export class ValidationError extends UnipileError {
  /** Detailed validation errors */
  public readonly errors: ValidationErrorDetail[];

  constructor(message: string, errors: ValidationErrorDetail[] = [], context: ErrorContext = {}) {
    super(message, ErrorCategory.VALIDATION, context, false);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  /**
   * Creates a JSON representation including validation details.
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}
