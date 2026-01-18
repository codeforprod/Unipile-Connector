import {
  UnipileError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  AuthError,
  ValidationError,
  NotFoundError,
} from './index.js';
import { ErrorCategory } from '../enums/error-category.enum.js';

describe('Errors', () => {
  describe('UnipileError', () => {
    it('should create error with correct properties', () => {
      const error = new UnipileError('Test error', ErrorCategory.UNKNOWN, { statusCode: 500 }, true);

      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.context.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('UnipileError');
    });

    it('should convert to JSON', () => {
      const error = new UnipileError('Test error', ErrorCategory.UNKNOWN, { statusCode: 500 });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'UnipileError',
        message: 'Test error',
        category: ErrorCategory.UNKNOWN,
        context: { statusCode: 500 },
        isRetryable: false,
      });
    });
  });

  describe('TimeoutError', () => {
    it('should have correct category and be retryable', () => {
      const error = new TimeoutError('Request timed out', { url: '/test' });

      expect(error.category).toBe(ErrorCategory.TIMEOUT);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('ConnectionError', () => {
    it('should have correct category and be retryable', () => {
      const error = new ConnectionError('Connection failed', { url: '/test' });

      expect(error.category).toBe(ErrorCategory.CONNECTION);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ConnectionError');
    });
  });

  describe('RateLimitError', () => {
    it('should have correct category and be retryable', () => {
      const error = new RateLimitError('Rate limit exceeded', { accountId: 'acc-123' });

      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('RateLimitError');
    });

    it('should store reset time', () => {
      const resetAt = new Date(Date.now() + 60000);
      const error = new RateLimitError('Rate limit exceeded', { rateLimitResetAt: resetAt });

      expect(error.resetAt).toEqual(resetAt);
    });

    it('should calculate retry after time', () => {
      const resetAt = new Date(Date.now() + 60000);
      const error = new RateLimitError('Rate limit exceeded', { rateLimitResetAt: resetAt });

      const retryAfter = error.getRetryAfterMs();
      expect(retryAfter).toBeGreaterThan(59000);
      expect(retryAfter).toBeLessThanOrEqual(60000);
    });

    it('should return 0 if reset time has passed', () => {
      const resetAt = new Date(Date.now() - 1000);
      const error = new RateLimitError('Rate limit exceeded', { rateLimitResetAt: resetAt });

      expect(error.getRetryAfterMs()).toBe(0);
    });

    it('should return 0 if no reset time', () => {
      const error = new RateLimitError('Rate limit exceeded');

      expect(error.getRetryAfterMs()).toBe(0);
    });
  });

  describe('AuthError', () => {
    it('should have correct category and not be retryable', () => {
      const error = new AuthError('Authentication failed');

      expect(error.category).toBe(ErrorCategory.AUTH);
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('AuthError');
    });
  });

  describe('ValidationError', () => {
    it('should have correct category and not be retryable', () => {
      const error = new ValidationError('Validation failed');

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('ValidationError');
    });

    it('should store validation error details', () => {
      const errors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'name', message: 'Name is required' },
      ];
      const error = new ValidationError('Validation failed', errors);

      expect(error.errors).toEqual(errors);
    });

    it('should include errors in JSON', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', errors);
      const json = error.toJSON();

      expect(json['errors']).toEqual(errors);
    });
  });

  describe('NotFoundError', () => {
    it('should have correct category and not be retryable', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('NotFoundError');
    });

    it('should store resource type and ID', () => {
      const error = new NotFoundError('User not found', 'User', 'user-123');

      expect(error.resourceType).toBe('User');
      expect(error.resourceId).toBe('user-123');
    });

    it('should include resource info in JSON', () => {
      const error = new NotFoundError('User not found', 'User', 'user-123');
      const json = error.toJSON();

      expect(json['resourceType']).toBe('User');
      expect(json['resourceId']).toBe('user-123');
    });
  });
});
