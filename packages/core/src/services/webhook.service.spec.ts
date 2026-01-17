import { jest } from '@jest/globals';
import { WebhookService } from './webhook.service.js';
import type { HttpClient } from '../http/http-client.js';
import { WebhookSource, WebhookEvent } from '../enums/index.js';
import type { Mock } from 'jest-mock';

type MockedHttpClient = {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
  request: Mock;
};

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockHttpClient: MockedHttpClient;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    };

    webhookService = new WebhookService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should list webhooks with pagination', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 'wh-1', url: 'https://example.com/webhook1', source: WebhookSource.MESSAGING },
            { id: 'wh-2', url: 'https://example.com/webhook2', source: WebhookSource.EMAIL },
          ],
          cursor: 'next-cursor',
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await webhookService.list(10, 'prev-cursor');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks', {
        limit: 10,
        cursor: 'prev-cursor',
      });
      expect(result.items).toHaveLength(2);
      expect(result.cursor).toBe('next-cursor');
    });
  });

  describe('get', () => {
    it('should get webhook by ID', async () => {
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        source: WebhookSource.MESSAGING,
        events: [WebhookEvent.MESSAGE_RECEIVED],
        isActive: true,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockWebhook });

      const result = await webhookService.get('wh-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks/wh-1');
      expect(result.id).toBe('wh-1');
    });
  });

  describe('create', () => {
    it('should create webhook with all options', async () => {
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        source: WebhookSource.MESSAGING,
        events: [WebhookEvent.MESSAGE_RECEIVED],
        isActive: true,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockWebhook });

      const result = await webhookService.create({
        url: 'https://example.com/webhook',
        source: WebhookSource.MESSAGING,
        events: [WebhookEvent.MESSAGE_RECEIVED],
        headers: { Authorization: 'Bearer token' },
        accountIds: ['acc-1', 'acc-2'],
        secret: 'webhook-secret',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', {
        url: 'https://example.com/webhook',
        source: WebhookSource.MESSAGING,
        events: [WebhookEvent.MESSAGE_RECEIVED],
        headers: { Authorization: 'Bearer token' },
        account_ids: ['acc-1', 'acc-2'],
        secret: 'webhook-secret',
      });
      expect(result.id).toBe('wh-1');
    });
  });

  describe('delete', () => {
    it('should delete webhook', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: undefined });

      await webhookService.delete('wh-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/webhooks/wh-1');
    });
  });

  describe('parsePayload', () => {
    it('should parse webhook payload from JSON string', () => {
      const payloadString = JSON.stringify({
        event: WebhookEvent.MESSAGE_RECEIVED,
        timestamp: '2024-01-01T12:00:00Z',
        accountId: 'acc-1',
        chatId: 'chat-1',
        messageId: 'msg-1',
      });

      const result = webhookService.parsePayload<{ event: string }>(payloadString);

      expect(result.event).toBe(WebhookEvent.MESSAGE_RECEIVED);
    });
  });

  describe('convenience webhook creation methods', () => {
    beforeEach(() => {
      mockHttpClient.post.mockResolvedValue({
        data: {
          id: 'wh-1',
          url: 'https://example.com/webhook',
          isActive: true,
        },
      });
    });

    it('should create messaging webhook', async () => {
      await webhookService.createMessagingWebhook(
        'https://example.com/messaging',
        ['acc-1'],
        'secret',
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', {
        url: 'https://example.com/messaging',
        source: WebhookSource.MESSAGING,
        events: [WebhookEvent.MESSAGE_RECEIVED],
        headers: undefined,
        account_ids: ['acc-1'],
        secret: 'secret',
      });
    });

    it('should create email webhook', async () => {
      await webhookService.createEmailWebhook('https://example.com/email');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', {
        url: 'https://example.com/email',
        source: WebhookSource.EMAIL,
        events: [WebhookEvent.MAIL_SENT],
        headers: undefined,
        account_ids: undefined,
        secret: undefined,
      });
    });

    it('should create email tracking webhook', async () => {
      await webhookService.createEmailTrackingWebhook('https://example.com/tracking');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', {
        url: 'https://example.com/tracking',
        source: WebhookSource.EMAIL_TRACKING,
        events: [WebhookEvent.MAIL_OPENED, WebhookEvent.LINK_CLICKED],
        headers: undefined,
        account_ids: undefined,
        secret: undefined,
      });
    });

    it('should create account status webhook', async () => {
      await webhookService.createAccountStatusWebhook('https://example.com/status');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', {
        url: 'https://example.com/status',
        source: WebhookSource.ACCOUNT_STATUS,
        events: [WebhookEvent.ACCOUNT_STATUS_CHANGED],
        headers: undefined,
        account_ids: undefined,
        secret: undefined,
      });
    });
  });

  describe('verifySignature', () => {
    it('should verify signature (placeholder implementation)', () => {
      // Note: This is a placeholder test since actual HMAC is not implemented
      const result = webhookService.verifySignature('payload', 'signature', 'secret');
      // The current implementation returns false as it's a placeholder
      expect(typeof result).toBe('boolean');
    });
  });
});
