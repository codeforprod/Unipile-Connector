import { jest } from '@jest/globals';
import { EmailService } from './email.service.js';
import type { HttpClient } from '../http/http-client.js';
import type { Mock } from 'jest-mock';

type MockedHttpClient = {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
  request: Mock;
};

describe('EmailService', () => {
  let emailService: EmailService;
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

    emailService = new EmailService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should list emails with filters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 'email-1', subject: 'Test 1' },
            { id: 'email-2', subject: 'Test 2' },
          ],
          cursor: 'next-cursor',
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await emailService.list({
        accountId: 'acc-1',
        folder: 'inbox',
        isRead: false,
        limit: 10,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/emails',
        {
          account_id: 'acc-1',
          folder: 'inbox',
          is_read: false,
          is_starred: undefined,
          query: undefined,
          date_from: undefined,
          date_to: undefined,
          limit: 10,
          cursor: undefined,
        },
        'acc-1',
      );
      expect(result.items).toHaveLength(2);
      expect(result.cursor).toBe('next-cursor');
    });
  });

  describe('get', () => {
    it('should get email by ID', async () => {
      const mockEmail = {
        id: 'email-1',
        subject: 'Test Email',
        from: { email: 'sender@example.com' },
      };
      mockHttpClient.get.mockResolvedValue({ data: mockEmail });

      const result = await emailService.get('email-1', 'acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        { account_id: 'acc-1' },
        'acc-1',
      );
      expect(result.id).toBe('email-1');
    });
  });

  describe('send', () => {
    it('should send email with all options', async () => {
      const mockEmail = {
        id: 'email-1',
        subject: 'Test Subject',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockEmail });

      const result = await emailService.send({
        accountId: 'acc-1',
        to: [{ email: 'recipient@example.com', name: 'Recipient' }],
        subject: 'Test Subject',
        body: 'Plain text body',
        bodyHtml: '<p>HTML body</p>',
        cc: [{ email: 'cc@example.com' }],
        tracking: true,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails',
        expect.objectContaining({
          account_id: 'acc-1',
          to: [{ email: 'recipient@example.com', name: 'Recipient' }],
          subject: 'Test Subject',
          body: 'Plain text body',
          body_html: '<p>HTML body</p>',
          tracking: true,
        }),
        'acc-1',
      );
      expect(result.id).toBe('email-1');
    });
  });

  describe('update', () => {
    it('should update email properties', async () => {
      const mockEmail = { id: 'email-1', isRead: true };
      mockHttpClient.patch.mockResolvedValue({ data: mockEmail });

      const result = await emailService.update('email-1', 'acc-1', { isRead: true });

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        {
          account_id: 'acc-1',
          is_read: true,
          is_starred: undefined,
          folder: undefined,
        },
        'acc-1',
      );
      expect(result.isRead).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete email', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: undefined });

      await emailService.delete('email-1', 'acc-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/api/v1/emails/email-1?account_id=acc-1',
        'acc-1',
      );
    });
  });

  describe('listFolders', () => {
    it('should list email folders', async () => {
      const mockFolders = [
        { id: 'inbox', name: 'Inbox', unreadCount: 5 },
        { id: 'sent', name: 'Sent', unreadCount: 0 },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { items: mockFolders } });

      const result = await emailService.listFolders('acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/emails/folders',
        { account_id: 'acc-1' },
        'acc-1',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockHttpClient.patch.mockResolvedValue({
        data: { id: 'email-1' },
      });
    });

    it('should mark as read', async () => {
      await emailService.markAsRead('email-1', 'acc-1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        expect.objectContaining({ is_read: true }),
        'acc-1',
      );
    });

    it('should mark as unread', async () => {
      await emailService.markAsUnread('email-1', 'acc-1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        expect.objectContaining({ is_read: false }),
        'acc-1',
      );
    });

    it('should star email', async () => {
      await emailService.star('email-1', 'acc-1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        expect.objectContaining({ is_starred: true }),
        'acc-1',
      );
    });

    it('should unstar email', async () => {
      await emailService.unstar('email-1', 'acc-1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        expect.objectContaining({ is_starred: false }),
        'acc-1',
      );
    });

    it('should move to folder', async () => {
      await emailService.moveToFolder('email-1', 'acc-1', 'archive');

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        expect.objectContaining({ folder: 'archive' }),
        'acc-1',
      );
    });
  });

  describe('reply', () => {
    it('should send reply with replyTo set', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { id: 'reply-1' } });

      await emailService.reply('original-1', {
        accountId: 'acc-1',
        to: [{ email: 'recipient@example.com' }],
        subject: 'Re: Original',
        body: 'Reply body',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails',
        expect.objectContaining({
          reply_to: 'original-1',
        }),
        'acc-1',
      );
    });
  });

  describe('list alternative response formats', () => {
    it('should handle emails field instead of items', async () => {
      const mockEmails = [
        { id: 'email-1', subject: 'Test 1' },
        { id: 'email-2', subject: 'Test 2' },
      ];
      mockHttpClient.get.mockResolvedValue({
        data: { emails: mockEmails, next_cursor: 'cursor-123' },
      });

      const result = await emailService.list({ accountId: 'acc-1' });

      expect(result.items).toEqual(mockEmails);
      expect(result.cursor).toBe('cursor-123');
    });

    it('should return empty array when no items or emails field', async () => {
      mockHttpClient.get.mockResolvedValue({ data: {} });

      const result = await emailService.list({ accountId: 'acc-1' });

      expect(result.items).toEqual([]);
      expect(result.cursor).toBeNull();
    });
  });

  describe('list with all filter options', () => {
    it('should apply all filter parameters', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { items: [], cursor: null },
      });

      await emailService.list({
        accountId: 'acc-1',
        folder: 'inbox',
        isRead: false,
        isStarred: true,
        query: 'important meeting',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        limit: 50,
        cursor: 'cursor-abc',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/emails',
        {
          account_id: 'acc-1',
          folder: 'inbox',
          is_read: false,
          is_starred: true,
          query: 'important meeting',
          date_from: '2024-01-01',
          date_to: '2024-12-31',
          limit: 50,
          cursor: 'cursor-abc',
        },
        'acc-1',
      );
    });
  });

  describe('listFolders alternative response format', () => {
    it('should handle folders field instead of items', async () => {
      const mockFolders = [
        { id: 'inbox', name: 'Inbox', unreadCount: 5 },
        { id: 'sent', name: 'Sent', unreadCount: 0 },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { folders: mockFolders } });

      const result = await emailService.listFolders('acc-1');

      expect(result).toEqual(mockFolders);
    });

    it('should return empty array when no items or folders field', async () => {
      mockHttpClient.get.mockResolvedValue({ data: {} });

      const result = await emailService.listFolders('acc-1');

      expect(result).toEqual([]);
    });
  });

  describe('send with attachments', () => {
    it('should send email with attachments', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { id: 'email-1' } });

      await emailService.send({
        accountId: 'acc-1',
        to: [{ email: 'recipient@example.com' }],
        subject: 'With attachment',
        body: 'Please see attached',
        attachments: [
          {
            filename: 'document.pdf',
            contentType: 'application/pdf',
            content: 'base64-encoded-content',
          },
        ],
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails',
        expect.objectContaining({
          attachments: [
            {
              filename: 'document.pdf',
              content_type: 'application/pdf',
              content: 'base64-encoded-content',
            },
          ],
        }),
        'acc-1',
      );
    });

    it('should send email with bcc recipients', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { id: 'email-1' } });

      await emailService.send({
        accountId: 'acc-1',
        to: [{ email: 'recipient@example.com' }],
        subject: 'With BCC',
        body: 'Test',
        bcc: [{ email: 'hidden@example.com', name: 'Hidden Recipient' }],
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails',
        expect.objectContaining({
          bcc: [{ email: 'hidden@example.com', name: 'Hidden Recipient' }],
        }),
        'acc-1',
      );
    });

    it('should send scheduled email', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { id: 'email-1' } });

      await emailService.send({
        accountId: 'acc-1',
        to: [{ email: 'recipient@example.com' }],
        subject: 'Scheduled',
        body: 'This is scheduled',
        scheduledAt: '2024-12-25T09:00:00Z',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails',
        expect.objectContaining({
          scheduled_at: '2024-12-25T09:00:00Z',
        }),
        'acc-1',
      );
    });
  });

  describe('createDraft', () => {
    it('should create draft with minimal data', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { id: 'draft-1' } });

      await emailService.createDraft({
        accountId: 'acc-1',
        subject: 'Draft subject',
        body: 'Draft body',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails/drafts',
        expect.objectContaining({
          account_id: 'acc-1',
          subject: 'Draft subject',
          body: 'Draft body',
          to: undefined,
        }),
        'acc-1',
      );
    });

    it('should create draft with all fields', async () => {
      mockHttpClient.post.mockResolvedValue({ data: { id: 'draft-1' } });

      await emailService.createDraft({
        accountId: 'acc-1',
        to: [{ email: 'recipient@example.com', name: 'Recipient' }],
        subject: 'Draft subject',
        body: 'Draft body',
        bodyHtml: '<p>Draft body</p>',
        cc: [{ email: 'cc@example.com' }],
        bcc: [{ email: 'bcc@example.com' }],
        attachments: [
          {
            filename: 'file.txt',
            contentType: 'text/plain',
            content: 'Y29udGVudA==',
          },
        ],
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/emails/drafts',
        expect.objectContaining({
          account_id: 'acc-1',
          to: [{ email: 'recipient@example.com', name: 'Recipient' }],
          subject: 'Draft subject',
          body: 'Draft body',
          body_html: '<p>Draft body</p>',
          cc: [{ email: 'cc@example.com', name: undefined }],
          bcc: [{ email: 'bcc@example.com', name: undefined }],
          attachments: [
            {
              filename: 'file.txt',
              content_type: 'text/plain',
              content: 'Y29udGVudA==',
            },
          ],
        }),
        'acc-1',
      );
    });
  });

  describe('update with all properties', () => {
    it('should update email with starred and folder', async () => {
      mockHttpClient.patch.mockResolvedValue({
        data: { id: 'email-1', isStarred: true, folder: 'archive' },
      });

      const result = await emailService.update('email-1', 'acc-1', {
        isStarred: true,
        folder: 'archive',
      });

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/api/v1/emails/email-1',
        {
          account_id: 'acc-1',
          is_read: undefined,
          is_starred: true,
          folder: 'archive',
        },
        'acc-1',
      );
    });
  });
});
