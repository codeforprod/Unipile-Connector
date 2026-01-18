import { ErrorCategory } from '../enums/error-category.enum.js';

/**
 * Error context containing additional debugging information.
 */
export interface ErrorContext {
  /** HTTP status code */
  statusCode?: number;

  /** Request URL */
  url?: string;

  /** Request method */
  method?: string;

  /** Response body */
  responseBody?: unknown;

  /** Account ID (if applicable) */
  accountId?: string;

  /** Retry attempt number */
  retryAttempt?: number;

  /** Rate limit reset timestamp */
  rateLimitResetAt?: Date;

  /** Original error */
  cause?: Error;
}

/**
 * Base error class for all Unipile-related errors.
 */
export class UnipileError extends Error {
  /** Error category for handling logic */
  public readonly category: ErrorCategory;

  /** Additional error context */
  public readonly context: ErrorContext;

  /** Whether this error is retryable */
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    category: ErrorCategory,
    context: ErrorContext = {},
    isRetryable = false,
  ) {
    super(message);
    this.name = 'UnipileError';
    this.category = category;
    this.context = context;
    this.isRetryable = isRetryable;

    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Creates a JSON representation of the error.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      context: this.context,
      isRetryable: this.isRetryable,
    };
  }
}
