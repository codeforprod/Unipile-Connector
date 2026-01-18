/**
 * Per-account rate limit state.
 */
interface AccountRateLimitState {
  /** Number of consecutive rate limit errors */
  consecutiveErrors: number;

  /** Timestamp when rate limit resets */
  resetAt: Date | null;

  /** Current backoff delay in milliseconds */
  currentBackoffMs: number;

  /** Last request timestamp */
  lastRequestAt: Date | null;
}

/**
 * Rate limiter with per-account tracking and exponential backoff.
 */
export class RateLimiter {
  private readonly accountStates: Map<string, AccountRateLimitState> = new Map();
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  /**
   * Creates a new rate limiter.
   * @param baseDelayMs - Base delay for exponential backoff (default: 5 minutes)
   * @param maxDelayMs - Maximum delay for exponential backoff (default: 2 hours)
   */
  constructor(baseDelayMs = 300000, maxDelayMs = 7200000) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  /**
   * Gets the rate limit state for an account.
   */
  private getAccountState(accountId: string): AccountRateLimitState {
    let state = this.accountStates.get(accountId);

    if (state === undefined) {
      state = {
        consecutiveErrors: 0,
        resetAt: null,
        currentBackoffMs: this.baseDelayMs,
        lastRequestAt: null,
      };
      this.accountStates.set(accountId, state);
    }

    return state;
  }

  /**
   * Checks if a request should be allowed for the given account.
   * Returns the number of milliseconds to wait, or 0 if allowed.
   */
  shouldWait(accountId: string): number {
    const state = this.getAccountState(accountId);

    // Check if we have a reset time from the API
    if (state.resetAt !== null) {
      const waitTime = state.resetAt.getTime() - Date.now();
      if (waitTime > 0) {
        return waitTime;
      }
      // Reset time has passed, clear it
      state.resetAt = null;
    }

    // Check exponential backoff
    if (state.consecutiveErrors > 0 && state.lastRequestAt !== null) {
      const timeSinceLastRequest = Date.now() - state.lastRequestAt.getTime();
      const waitTime = state.currentBackoffMs - timeSinceLastRequest;
      if (waitTime > 0) {
        return waitTime;
      }
    }

    return 0;
  }

  /**
   * Records a successful request for an account.
   */
  recordSuccess(accountId: string): void {
    const state = this.getAccountState(accountId);
    state.consecutiveErrors = 0;
    state.currentBackoffMs = this.baseDelayMs;
    state.resetAt = null;
    state.lastRequestAt = new Date();
  }

  /**
   * Records a rate limit error for an account.
   * @param accountId - Account identifier
   * @param resetAt - Optional timestamp when rate limit resets
   */
  recordRateLimitError(accountId: string, resetAt?: Date): void {
    const state = this.getAccountState(accountId);
    state.consecutiveErrors++;
    state.lastRequestAt = new Date();

    if (resetAt !== undefined) {
      state.resetAt = resetAt;
    } else {
      // Apply exponential backoff
      state.currentBackoffMs = Math.min(state.currentBackoffMs * 2, this.maxDelayMs);
    }
  }

  /**
   * Resets the rate limit state for an account.
   */
  reset(accountId: string): void {
    this.accountStates.delete(accountId);
  }

  /**
   * Resets all rate limit states.
   */
  resetAll(): void {
    this.accountStates.clear();
  }

  /**
   * Gets the current backoff delay for an account in milliseconds.
   */
  getCurrentBackoff(accountId: string): number {
    const state = this.getAccountState(accountId);
    return state.currentBackoffMs;
  }

  /**
   * Gets the number of consecutive errors for an account.
   */
  getConsecutiveErrors(accountId: string): number {
    const state = this.getAccountState(accountId);
    return state.consecutiveErrors;
  }

  /**
   * Parses rate limit headers from HTTP response.
   * @param headers - Response headers
   * @returns Reset timestamp if available
   */
  static parseRateLimitHeaders(headers: Headers): Date | undefined {
    // Check for Retry-After header (seconds)
    const retryAfter = headers.get('retry-after');
    if (retryAfter !== null) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return new Date(Date.now() + seconds * 1000);
      }
      // Try parsing as HTTP date
      const date = new Date(retryAfter);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Check for X-RateLimit-Reset header (Unix timestamp)
    const rateLimitReset = headers.get('x-ratelimit-reset');
    if (rateLimitReset !== null) {
      const timestamp = parseInt(rateLimitReset, 10);
      if (!isNaN(timestamp)) {
        // Convert seconds to milliseconds if needed
        const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
        return new Date(ms);
      }
    }

    return undefined;
  }
}
