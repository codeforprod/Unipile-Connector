import { ErrorCategory } from '../enums/error-category.enum.js';
import { UnipileError, type ErrorContext } from './unipile.error.js';

/**
 * Error thrown when a network connection fails.
 */
export class ConnectionError extends UnipileError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCategory.CONNECTION, context, true);
    this.name = 'ConnectionError';
  }
}
