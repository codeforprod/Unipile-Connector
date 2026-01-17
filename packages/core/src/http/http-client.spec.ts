import { jest } from '@jest/globals';
import { HttpClient } from './http-client.js';
import {
  TimeoutError,
  RateLimitError,
  AuthError,
  NotFoundError,
  ValidationError,
  ConnectionError,
  UnipileError,
} from '../errors/index.js';
import { ErrorCategory } from '../enums/error-category.enum.js';
import type { Mock } from 'jest-mock';

// Mock fetch globally
const mockFetch = jest.fn() as Mock;
global.fetch = mockFetch as unknown as typeof fetch;

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      dsn: 'api.example.com:443',
      apiKey: 'test-api-key',
      timeout: 5000,
      enableRetry: false,
    });
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should use HTTPS by default', () => {
      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
      });
      expect(client).toBeDefined();
    });

    it('should use HTTP when useHttp is true', () => {
      const client = new HttpClient({
        dsn: 'api.example.com:80',
        apiKey: 'test-key',
        useHttp: true,
      });
      expect(client).toBeDefined();
    });
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const responseData = { id: '123', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(responseData),
      });

      const response = await httpClient.get<typeof responseData>('/api/v1/test');

      expect(response.data).toEqual(responseData);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-KEY': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'New Item' };
      const responseData = { id: '456', name: 'New Item' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(responseData),
      });

      const response = await httpClient.post<typeof responseData>('/api/v1/test', requestBody);

      expect(response.data).toEqual(responseData);
      expect(response.status).toBe(201);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        }),
      );
    });

    it('should add query parameters to URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ items: [] }),
      });

      await httpClient.get('/api/v1/test', { limit: 10, offset: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/test?limit=10&offset=20',
        expect.anything(),
      );
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: jest.fn().mockRejectedValue(new Error('No content')),
      });

      const response = await httpClient.delete('/api/v1/test/123');

      expect(response.status).toBe(204);
      expect(response.data).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw RateLimitError on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        url: 'https://api.example.com:443/api/v1/test',
        headers: new Headers({ 'retry-after': '60' }),
        json: jest.fn().mockResolvedValue({ message: 'Rate limit exceeded' }),
      });

      await expect(httpClient.get('/api/v1/test')).rejects.toThrow(RateLimitError);
    });

    it('should throw AuthError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        url: 'https://api.example.com:443/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Invalid API key' }),
      });

      await expect(httpClient.get('/api/v1/test')).rejects.toThrow(AuthError);
    });

    it('should throw AuthError on 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        url: 'https://api.example.com:443/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
      });

      await expect(httpClient.get('/api/v1/test')).rejects.toThrow(AuthError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        url: 'https://api.example.com:443/api/v1/test/123',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Not found' }),
      });

      await expect(httpClient.get('/api/v1/test/123')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError on 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        url: 'https://api.example.com:443/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Invalid request' }),
      });

      await expect(httpClient.post('/api/v1/test', {})).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError on 422', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        url: 'https://api.example.com:443/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Validation failed' }),
      });

      await expect(httpClient.post('/api/v1/test', {})).rejects.toThrow(ValidationError);
    });

    it('should throw TimeoutError when request times out', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(httpClient.get('/api/v1/test')).rejects.toThrow(TimeoutError);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      });
    });

    it('should call GET with correct method', async () => {
      await httpClient.get('/api/v1/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should call POST with correct method', async () => {
      await httpClient.post('/api/v1/test', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should call PUT with correct method', async () => {
      await httpClient.put('/api/v1/test', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('should call PATCH with correct method', async () => {
      await httpClient.patch('/api/v1/test', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('should call DELETE with correct method', async () => {
      await httpClient.delete('/api/v1/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('getRateLimiter', () => {
    it('should return the rate limiter instance', () => {
      const rateLimiter = httpClient.getRateLimiter();
      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter.shouldWait).toBe('function');
    });
  });

  describe('rate limit handling', () => {
    it('should throw RateLimitError immediately when retry is disabled and rate limited', async () => {
      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
        enableRetry: false,
      });

      // Simulate rate limit state by recording a rate limit error
      client.getRateLimiter().recordRateLimitError('acc-1', new Date(Date.now() + 5000));

      await expect(
        client.request({ method: 'GET', path: '/test', accountId: 'acc-1' }),
      ).rejects.toThrow(RateLimitError);
    });

    it('should wait and retry when rate limited and retry is enabled', async () => {
      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
        enableRetry: true,
        maxRetries: 2,
      });

      // Set up a short rate limit
      client.getRateLimiter().recordRateLimitError('acc-1', new Date(Date.now() + 50));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await client.get('/test', {}, 'acc-1');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry after RateLimitError with proper backoff', async () => {
      mockFetch.mockClear();

      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
        enableRetry: true,
        maxRetries: 3,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          url: 'https://api.example.com/api/v1/test',
          headers: new Headers({ 'retry-after': '0' }),
          json: jest.fn().mockResolvedValue({ message: 'Rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ success: true }),
        });

      const resultPromise = client.get('/test');

      // Advance timers to allow retry
      await jest.advanceTimersByTimeAsync(500000);

      const result = await resultPromise;

      expect(result.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff for retryable server errors', async () => {
      mockFetch.mockClear();

      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
        enableRetry: true,
        maxRetries: 2,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          url: 'https://api.example.com/api/v1/test',
          headers: new Headers(),
          json: jest.fn().mockResolvedValue({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ success: true }),
        });

      const resultPromise = client.get('/test');

      // Advance timers to allow retry (exponential backoff starts at 1000ms)
      await jest.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should exhaust retries and throw last error', async () => {
      mockFetch.mockClear();

      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
        enableRetry: true,
        maxRetries: 2,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          url: 'https://api.example.com/api/v1/test',
          headers: new Headers(),
          json: jest.fn().mockResolvedValue({ message: 'Server error 1' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          url: 'https://api.example.com/api/v1/test',
          headers: new Headers(),
          json: jest.fn().mockResolvedValue({ message: 'Server error 2' }),
        });

      // Start the request and attach error handler immediately
      const resultPromise = client.get('/test').catch((error) => {
        // Capture the error for assertion
        return { error };
      });

      // Run all pending timers to allow retries to complete
      await jest.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toHaveProperty('error');
      const { error } = result as { error: unknown };
      expect(error).toBeInstanceOf(UnipileError);
      expect((error as UnipileError).message).toBe('Server error 2');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      mockFetch.mockClear();

      const client = new HttpClient({
        dsn: 'api.example.com:443',
        apiKey: 'test-key',
        enableRetry: true,
        maxRetries: 3,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Bad request' }),
      });

      await expect(client.get('/test')).rejects.toThrow(ValidationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection error detection', () => {
    it('should throw ConnectionError for ECONNREFUSED', async () => {
      mockFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:443'));

      await expect(httpClient.get('/test')).rejects.toThrow(ConnectionError);
    });

    it('should throw ConnectionError for ENOTFOUND', async () => {
      mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.example.com'));

      await expect(httpClient.get('/test')).rejects.toThrow(ConnectionError);
    });

    it('should throw ConnectionError for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network timeout at api.example.com'));

      await expect(httpClient.get('/test')).rejects.toThrow(ConnectionError);
    });
  });

  describe('unknown error handling', () => {
    it('should wrap unknown errors in UnipileError', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Unexpected internal error'));

      await expect(httpClient.get('/test')).rejects.toThrow(UnipileError);
    });

    it('should handle non-Error thrown objects', async () => {
      mockFetch.mockRejectedValueOnce('string error');

      await expect(httpClient.get('/test')).rejects.toThrow(UnipileError);
    });

    it('should rethrow UnipileError subclasses without wrapping', async () => {
      const customError = new RateLimitError('Custom rate limit');
      mockFetch.mockRejectedValueOnce(customError);

      await expect(httpClient.get('/test')).rejects.toThrow(RateLimitError);
    });
  });

  describe('server error handling', () => {
    it('should throw retryable UnipileError for 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Internal server error' }),
      });

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnipileError);
        expect((error as UnipileError).isRetryable).toBe(true);
      }
    });

    it('should throw non-retryable UnipileError for other 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 405,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ message: 'Method not allowed' }),
      });

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnipileError);
        expect((error as UnipileError).isRetryable).toBe(false);
      }
    });
  });

  describe('response parsing', () => {
    it('should handle text response when content-type is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('Plain text response'),
      });

      const response = await httpClient.get<string>('/test');
      expect(response.data).toBe('Plain text response');
    });

    it('should extract error message from error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ error: 'Field level error' }),
      });

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('Field level error');
      }
    });

    it('should extract error message from error_description field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ error_description: 'OAuth error description' }),
      });

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('OAuth error description');
      }
    });

    it('should use fallback message when body has no message fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({}),
      });

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('Validation failed');
      }
    });

    it('should handle non-JSON error response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        url: 'https://api.example.com/api/v1/test',
        headers: new Headers(),
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      });

      await expect(httpClient.get('/test')).rejects.toThrow(UnipileError);
    });
  });

  describe('query parameter handling', () => {
    it('should skip undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      });

      await httpClient.get('/test', { defined: 'value', undefinedParam: undefined });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test?defined=value',
        expect.anything(),
      );
    });

    it('should handle boolean query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      });

      await httpClient.get('/test', { flag: true, another: false });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test?flag=true&another=false',
        expect.anything(),
      );
    });
  });
});
