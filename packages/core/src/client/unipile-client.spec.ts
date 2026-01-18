import { UnipileClient } from './unipile-client.js';
import { AccountService } from '../services/account.service.js';
import { EmailService } from '../services/email.service.js';
import { MessagingService } from '../services/messaging.service.js';
import { LinkedInService } from '../services/linkedin.service.js';
import { WebhookService } from '../services/webhook.service.js';
import { HttpClient } from '../http/http-client.js';
import { RateLimiter } from '../http/rate-limiter.js';

describe('UnipileClient', () => {
  let client: UnipileClient;

  beforeEach(() => {
    client = new UnipileClient({
      dsn: 'api.example.com:443',
      apiKey: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create client with all services', () => {
      expect(client.accounts).toBeInstanceOf(AccountService);
      expect(client.email).toBeInstanceOf(EmailService);
      expect(client.messaging).toBeInstanceOf(MessagingService);
      expect(client.linkedin).toBeInstanceOf(LinkedInService);
      expect(client.webhooks).toBeInstanceOf(WebhookService);
    });
  });

  describe('getHttpClient', () => {
    it('should return the HTTP client', () => {
      const httpClient = client.getHttpClient();
      expect(httpClient).toBeInstanceOf(HttpClient);
    });
  });

  describe('rate limit management', () => {
    it('should reset rate limit for specific account', () => {
      const rateLimiter = client.getHttpClient().getRateLimiter();
      rateLimiter.recordRateLimitError('account-1');
      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(1);

      client.resetRateLimit('account-1');
      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(0);
    });

    it('should reset all rate limits', () => {
      const rateLimiter = client.getHttpClient().getRateLimiter();
      rateLimiter.recordRateLimitError('account-1');
      rateLimiter.recordRateLimitError('account-2');

      client.resetAllRateLimits();

      expect(rateLimiter.getConsecutiveErrors('account-1')).toBe(0);
      expect(rateLimiter.getConsecutiveErrors('account-2')).toBe(0);
    });
  });

  describe('fromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should create client from environment variables', () => {
      process.env['UNIPILE_DSN'] = 'api.example.com:443';
      process.env['UNIPILE_API_KEY'] = 'env-api-key';

      const envClient = UnipileClient.fromEnv();

      expect(envClient).toBeInstanceOf(UnipileClient);
      expect(envClient.accounts).toBeInstanceOf(AccountService);
    });

    it('should throw if UNIPILE_DSN is missing', () => {
      delete process.env['UNIPILE_DSN'];
      process.env['UNIPILE_API_KEY'] = 'env-api-key';

      expect(() => UnipileClient.fromEnv()).toThrow('UNIPILE_DSN environment variable is required');
    });

    it('should throw if UNIPILE_API_KEY is missing', () => {
      process.env['UNIPILE_DSN'] = 'api.example.com:443';
      delete process.env['UNIPILE_API_KEY'];

      expect(() => UnipileClient.fromEnv()).toThrow('UNIPILE_API_KEY environment variable is required');
    });

    it('should respect UNIPILE_USE_HTTP flag', () => {
      process.env['UNIPILE_DSN'] = 'api.example.com:80';
      process.env['UNIPILE_API_KEY'] = 'env-api-key';
      process.env['UNIPILE_USE_HTTP'] = 'true';

      const envClient = UnipileClient.fromEnv();
      expect(envClient).toBeInstanceOf(UnipileClient);
    });
  });
});
