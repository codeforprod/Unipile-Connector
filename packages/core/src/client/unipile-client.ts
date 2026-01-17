import type { UnipileConfig } from '../interfaces/config.interface.js';
import { HttpClient } from '../http/http-client.js';
import { AccountService } from '../services/account.service.js';
import { EmailService } from '../services/email.service.js';
import { MessagingService } from '../services/messaging.service.js';
import { LinkedInService } from '../services/linkedin.service.js';
import { WebhookService } from '../services/webhook.service.js';

/**
 * Main Unipile client providing access to all API services.
 *
 * @example
 * ```typescript
 * const client = new UnipileClient({
 *   dsn: 'api6.unipile.com:13624',
 *   apiKey: 'your-api-key',
 * });
 *
 * // List accounts
 * const accounts = await client.accounts.list();
 *
 * // Send an email
 * await client.email.send({
 *   accountId: 'account-123',
 *   to: [{ email: 'recipient@example.com' }],
 *   subject: 'Hello',
 *   body: 'Hello, world!',
 * });
 *
 * // Search LinkedIn companies
 * const companies = await client.linkedin.searchCompanies({
 *   accountId: 'linkedin-account-123',
 *   filters: {
 *     industries: ['Technology'],
 *     locations: ['San Francisco'],
 *   },
 * });
 * ```
 */
export class UnipileClient {
  private readonly httpClient: HttpClient;

  /** Account management service */
  public readonly accounts: AccountService;

  /** Email operations service */
  public readonly email: EmailService;

  /** Messaging operations service */
  public readonly messaging: MessagingService;

  /** LinkedIn Sales Navigator service */
  public readonly linkedin: LinkedInService;

  /** Webhook management service */
  public readonly webhooks: WebhookService;

  /**
   * Creates a new Unipile client.
   * @param config - Client configuration
   */
  constructor(config: UnipileConfig) {
    this.httpClient = new HttpClient(config);
    this.accounts = new AccountService(this.httpClient);
    this.email = new EmailService(this.httpClient);
    this.messaging = new MessagingService(this.httpClient);
    this.linkedin = new LinkedInService(this.httpClient);
    this.webhooks = new WebhookService(this.httpClient);
  }

  /**
   * Gets the underlying HTTP client for advanced usage.
   * @returns HTTP client instance
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Resets rate limit state for a specific account.
   * @param accountId - Account identifier
   */
  resetRateLimit(accountId: string): void {
    this.httpClient.getRateLimiter().reset(accountId);
  }

  /**
   * Resets all rate limit states.
   */
  resetAllRateLimits(): void {
    this.httpClient.getRateLimiter().resetAll();
  }

  /**
   * Creates a new Unipile client from environment variables.
   *
   * Uses the following environment variables:
   * - UNIPILE_DSN: API domain:port
   * - UNIPILE_API_KEY: API access token
   * - UNIPILE_USE_HTTP: Use HTTP instead of HTTPS (optional)
   *
   * @returns Unipile client instance
   * @throws Error if required environment variables are not set
   */
  static fromEnv(): UnipileClient {
    const dsn = process.env['UNIPILE_DSN'];
    const apiKey = process.env['UNIPILE_API_KEY'];
    const useHttp = process.env['UNIPILE_USE_HTTP'] === 'true';

    if (dsn === undefined || dsn === '') {
      throw new Error('UNIPILE_DSN environment variable is required');
    }

    if (apiKey === undefined || apiKey === '') {
      throw new Error('UNIPILE_API_KEY environment variable is required');
    }

    return new UnipileClient({
      dsn,
      apiKey,
      useHttp,
    });
  }
}
