import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(1000, 10000); // 1s base, 10s max
  });

  describe('shouldWait', () => {
    it('should return 0 for new account', () => {
      const waitTime = rateLimiter.shouldWait('account-1');
      expect(waitTime).toBe(0);
    });

    it('should return 0 after successful request', () => {
      rateLimiter.recordSuccess('account-1');
      const waitTime = rateLimiter.shouldWait('account-1');
      expect(waitTime).toBe(0);
    });

    it('should return wait time after rate limit error', () => {
      rateLimiter.recordRateLimitError('account-1');
      const waitTime = rateLimiter.shouldWait('account-1');
      expect(waitTime).toBeGreaterThan(0);
      // After first error, backoff is doubled to 2000ms (base 1000ms * 2)
      expect(waitTime).toBeLessThanOrEqual(2000);
    });

    it('should respect reset time from API', () => {
      const resetAt = new Date(Date.now() + 5000);
      rateLimiter.recordRateLimitError('account-1', resetAt);
      const waitTime = rateLimiter.shouldWait('account-1');
      expect(waitTime).toBeGreaterThan(4000);
      expect(waitTime).toBeLessThanOrEqual(5000);
    });

    it('should apply exponential backoff after reset time passes', () => {
      // When resetAt is provided, exponential backoff is not applied until reset time passes
      const resetAt = new Date(Date.now() - 1000); // Already passed
      rateLimiter.recordRateLimitError('account-1', resetAt);
      const waitTime = rateLimiter.shouldWait('account-1');
      // Should still have backoff since consecutiveErrors > 0 and baseDelay is used
      // After reset time clears, exponential backoff (currentBackoffMs) applies
      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(1000);
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive errors', () => {
      rateLimiter.recordRateLimitError('account-1');
      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(2);

      rateLimiter.recordSuccess('account-1');
      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(0);
    });

    it('should reset backoff delay', () => {
      rateLimiter.recordRateLimitError('account-1');
      rateLimiter.recordRateLimitError('account-1');
      // After two errors: first error doubles to 2000, second doubles to 4000
      expect(rateLimiter.getCurrentBackoff('account-1')).toBe(4000);

      rateLimiter.recordSuccess('account-1');
      expect(rateLimiter.getCurrentBackoff('account-1')).toBe(1000); // Reset to base
    });
  });

  describe('recordRateLimitError', () => {
    it('should increment consecutive errors', () => {
      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(1);

      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(2);
    });

    it('should apply exponential backoff', () => {
      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getCurrentBackoff('account-1')).toBe(2000);

      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getCurrentBackoff('account-1')).toBe(4000);

      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getCurrentBackoff('account-1')).toBe(8000);
    });

    it('should cap backoff at max delay', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.recordRateLimitError('account-1');
      }
      expect(rateLimiter.getCurrentBackoff('account-1')).toBe(10000);
    });
  });

  describe('reset', () => {
    it('should clear state for specific account', () => {
      rateLimiter.recordRateLimitError('account-1');
      rateLimiter.recordRateLimitError('account-2');

      rateLimiter.reset('account-1');

      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(0);
      expect(rateLimiter.getConsecutiveErrors('account-2')).toBe(1);
    });
  });

  describe('resetAll', () => {
    it('should clear state for all accounts', () => {
      rateLimiter.recordRateLimitError('account-1');
      rateLimiter.recordRateLimitError('account-2');

      rateLimiter.resetAll();

      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(0);
      expect(rateLimiter.getConsecutiveErrors('account-2')).toBe(0);
    });
  });

  describe('parseRateLimitHeaders', () => {
    it('should parse Retry-After header in seconds', () => {
      const headers = new Headers({ 'retry-after': '60' });
      const resetAt = RateLimiter.parseRateLimitHeaders(headers);

      expect(resetAt).toBeDefined();
      const diff = resetAt!.getTime() - Date.now();
      expect(diff).toBeGreaterThan(59000);
      expect(diff).toBeLessThanOrEqual(60000);
    });

    it('should parse Retry-After header as HTTP date', () => {
      const futureDate = new Date(Date.now() + 120000);
      const headers = new Headers({ 'retry-after': futureDate.toUTCString() });
      const resetAt = RateLimiter.parseRateLimitHeaders(headers);

      expect(resetAt).toBeDefined();
      expect(Math.abs(resetAt!.getTime() - futureDate.getTime())).toBeLessThan(1000);
    });

    it('should parse X-RateLimit-Reset header as Unix timestamp', () => {
      const futureTimestamp = Math.floor((Date.now() + 120000) / 1000);
      const headers = new Headers({ 'x-ratelimit-reset': String(futureTimestamp) });
      const resetAt = RateLimiter.parseRateLimitHeaders(headers);

      expect(resetAt).toBeDefined();
      expect(Math.abs(resetAt!.getTime() - futureTimestamp * 1000)).toBeLessThan(1000);
    });

    it('should return undefined if no rate limit headers', () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      const resetAt = RateLimiter.parseRateLimitHeaders(headers);
      expect(resetAt).toBeUndefined();
    });
  });
});
