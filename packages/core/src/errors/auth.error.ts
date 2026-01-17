import { ErrorCategory } from '../enums/error-category.enum.js';
import { UnipileError, type ErrorContext } from './unipile.error.js';

/**
 * Error thrown for authentication/authorization failures.
 */
export class AuthError extends UnipileError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCategory.AUTH, context, false);
    this.name = 'AuthError';
  }
}
