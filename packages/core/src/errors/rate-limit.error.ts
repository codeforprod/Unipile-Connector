import { ErrorCategory } from '../enums/error-category.enum.js';
import { UnipileError, type ErrorContext } from './unipile.error.js';

/**
 * Error thrown when rate limit is exceeded (HTTP 429).
 */
export class RateLimitError extends UnipileError {
  /** Timestamp when rate limit resets */
  public readonly resetAt?: Date;

  /** Account ID that triggered rate limit */
  public readonly accountId?: string;

  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCategory.RATE_LIMIT, context, true);
    this.name = 'RateLimitError';
    this.resetAt = context.rateLimitResetAt;
    this.accountId = context.accountId;
  }

  /**
   * Returns milliseconds until rate limit resets.
   */
  getRetryAfterMs(): number {
    if (this.resetAt === undefined) {
      return 0;
    }
    return Math.max(0, this.resetAt.getTime() - Date.now());
  }
}
