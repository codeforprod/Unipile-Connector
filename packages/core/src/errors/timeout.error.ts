import { ErrorCategory } from '../enums/error-category.enum.js';
import { UnipileError, type ErrorContext } from './unipile.error.js';

/**
 * Error thrown when a request times out.
 */
export class TimeoutError extends UnipileError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCategory.TIMEOUT, context, true);
    this.name = 'TimeoutError';
  }
}
