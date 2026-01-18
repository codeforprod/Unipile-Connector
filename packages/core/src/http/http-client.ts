import type { UnipileConfig } from '../interfaces/config.interface.js';
import { DEFAULT_CONFIG } from '../interfaces/config.interface.js';
import {
  UnipileError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  AuthError,
  NotFoundError,
  ValidationError,
} from '../errors/index.js';
import { ErrorCategory } from '../enums/error-category.enum.js';
import { RateLimiter } from './rate-limiter.js';

/**
 * HTTP request options.
 */
export interface RequestOptions {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /** Request path (without base URL) */
  path: string;

  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;

  /** Request body */
  body?: unknown;

  /** Additional headers */
  headers?: Record<string, string>;

  /** Account ID for rate limiting */
  accountId?: string;

  /** Request timeout override */
  timeout?: number;
}

/**
 * HTTP response wrapper.
 */
export interface HttpResponse<T> {
  /** Response data */
  data: T;

  /** HTTP status code */
  status: number;

  /** Response headers */
  headers: Headers;
}

/**
 * Core HTTP client for Unipile API with rate limiting and retry support.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly enableRetry: boolean;
  private readonly maxRetries: number;
  private readonly rateLimiter: RateLimiter;

  constructor(config: UnipileConfig) {
    const protocol = config.useHttp === true ? 'http' : 'https';
    this.baseUrl = `${protocol}://${config.dsn}`;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
    this.enableRetry = config.enableRetry ?? DEFAULT_CONFIG.enableRetry;
    this.maxRetries = config.maxRetries ?? DEFAULT_CONFIG.maxRetries;
    this.rateLimiter = new RateLimiter(
      config.retryBaseDelay ?? DEFAULT_CONFIG.retryBaseDelay,
      config.retryMaxDelay ?? DEFAULT_CONFIG.retryMaxDelay,
    );
  }

  /**
   * Makes an HTTP request with rate limiting and retry support.
   */
  async request<T>(options: RequestOptions): Promise<HttpResponse<T>> {
    const accountId = options.accountId ?? 'global';

    // Check rate limit before making request
    const waitTime = this.rateLimiter.shouldWait(accountId);
    if (waitTime > 0) {
      if (this.enableRetry) {
        await this.sleep(waitTime);
      } else {
        throw new RateLimitError(`Rate limit active, retry after ${waitTime}ms`, {
          accountId,
          rateLimitResetAt: new Date(Date.now() + waitTime),
        });
      }
    }

    let lastError: Error | undefined;
    const maxAttempts = this.enableRetry ? this.maxRetries : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(options, attempt);
        this.rateLimiter.recordSuccess(accountId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof UnipileError) {
          if (!error.isRetryable || attempt >= maxAttempts) {
            throw error;
          }

          if (error instanceof RateLimitError) {
            this.rateLimiter.recordRateLimitError(accountId, error.resetAt);
            const retryAfter = error.getRetryAfterMs();
            if (retryAfter > 0) {
              await this.sleep(retryAfter);
            } else {
              await this.sleep(this.rateLimiter.getCurrentBackoff(accountId));
            }
          } else {
            // Exponential backoff for other retryable errors
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
            await this.sleep(delay);
          }
        } else {
          throw error;
        }
      }
    }

    throw lastError ?? new UnipileError('Request failed after retries', ErrorCategory.UNKNOWN, {});
  }

  /**
   * Executes a single HTTP request.
   */
  private async executeRequest<T>(
    options: RequestOptions,
    attempt: number,
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(options.path, options.params);
    const timeout = options.timeout ?? this.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      };

      const fetchOptions: RequestInit = {
        method: options.method,
        headers,
        signal: controller.signal,
      };

      if (options.body !== undefined) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      return await this.handleResponse<T>(response, options, attempt);
    } catch (error) {
      if (error instanceof UnipileError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(`Request timed out after ${timeout}ms`, {
            url,
            method: options.method,
            retryAttempt: attempt,
          });
        }

        if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('network')
        ) {
          throw new ConnectionError(`Connection failed: ${error.message}`, {
            url,
            method: options.method,
            retryAttempt: attempt,
            cause: error,
          });
        }
      }

      throw new UnipileError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCategory.UNKNOWN,
        {
          url,
          method: options.method,
          retryAttempt: attempt,
        },
        true,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handles HTTP response and converts to appropriate types/errors.
   */
  private async handleResponse<T>(
    response: Response,
    options: RequestOptions,
    attempt: number,
  ): Promise<HttpResponse<T>> {
    const context = {
      statusCode: response.status,
      url: response.url,
      method: options.method,
      accountId: options.accountId,
      retryAttempt: attempt,
    };

    // Handle rate limiting (429)
    if (response.status === 429) {
      const resetAt = RateLimiter.parseRateLimitHeaders(response.headers);
      throw new RateLimitError('Rate limit exceeded', {
        ...context,
        rateLimitResetAt: resetAt,
      });
    }

    // Handle authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      const body = await this.safeParseJson(response);
      throw new AuthError(this.extractErrorMessage(body, 'Authentication failed'), {
        ...context,
        responseBody: body,
      });
    }

    // Handle not found (404)
    if (response.status === 404) {
      const body = await this.safeParseJson(response);
      throw new NotFoundError(this.extractErrorMessage(body, 'Resource not found'), undefined, undefined, {
        ...context,
        responseBody: body,
      });
    }

    // Handle validation errors (400, 422)
    if (response.status === 400 || response.status === 422) {
      const body = await this.safeParseJson(response);
      throw new ValidationError(this.extractErrorMessage(body, 'Validation failed'), [], {
        ...context,
        responseBody: body,
      });
    }

    // Handle server errors (500+)
    if (response.status >= 500) {
      const body = await this.safeParseJson(response);
      throw new UnipileError(this.extractErrorMessage(body, 'Server error'), ErrorCategory.UNKNOWN, {
        ...context,
        responseBody: body,
      }, true);
    }

    // Handle other client errors
    if (response.status >= 400) {
      const body = await this.safeParseJson(response);
      throw new UnipileError(this.extractErrorMessage(body, 'Request failed'), ErrorCategory.UNKNOWN, {
        ...context,
        responseBody: body,
      }, false);
    }

    // Parse successful response
    let data: T;
    const contentType = response.headers.get('content-type');

    if (response.status === 204) {
      data = undefined as T;
    } else if (contentType?.includes('application/json') === true) {
      data = (await response.json()) as T;
    } else {
      data = (await response.text()) as T;
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * Builds the full URL with query parameters.
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);

    if (params !== undefined) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Safely parses JSON response body.
   */
  private async safeParseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Extracts error message from response body.
   */
  private extractErrorMessage(body: unknown, fallback: string): string {
    if (body !== null && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (typeof obj['message'] === 'string') {
        return obj['message'];
      }
      if (typeof obj['error'] === 'string') {
        return obj['error'];
      }
      if (typeof obj['error_description'] === 'string') {
        return obj['error_description'];
      }
    }
    return fallback;
  }

  /**
   * Sleeps for the specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gets the rate limiter instance.
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Convenience method for GET requests.
   */
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, accountId?: string): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', path, params, accountId });
  }

  /**
   * Convenience method for POST requests.
   */
  post<T>(path: string, body?: unknown, accountId?: string): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, accountId });
  }

  /**
   * Convenience method for PUT requests.
   */
  put<T>(path: string, body?: unknown, accountId?: string): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, accountId });
  }

  /**
   * Convenience method for PATCH requests.
   */
  patch<T>(path: string, body?: unknown, accountId?: string): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body, accountId });
  }

  /**
   * Convenience method for DELETE requests.
   */
  delete<T>(path: string, accountId?: string): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, accountId });
  }
}
