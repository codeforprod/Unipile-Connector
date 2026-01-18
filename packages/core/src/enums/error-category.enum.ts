/**
 * Error categories for categorized error handling.
 */
export enum ErrorCategory {
  /** Request timed out */
  TIMEOUT = 'timeout',

  /** Network connection error */
  CONNECTION = 'connection',

  /** Rate limit exceeded (429) */
  RATE_LIMIT = 'rate_limit',

  /** Authentication/authorization error */
  AUTH = 'auth',

  /** Validation error */
  VALIDATION = 'validation',

  /** Resource not found */
  NOT_FOUND = 'not_found',

  /** Unknown/unclassified error */
  UNKNOWN = 'unknown',
}
