import { jest } from '@jest/globals';
import { MessagingService } from './messaging.service.js';
import type { HttpClient } from '../http/http-client.js';
import { AccountProvider } from '../enums/index.js';
import type { Mock } from 'jest-mock';

type MockedHttpClient = {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
  request: Mock;
};

describe('MessagingService', () => {
  let messagingService: MessagingService;
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

    messagingService = new MessagingService(mockHttpClient as unknown as HttpClient);
  });

  describe('listChats', () => {
    it('should list chats with filters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 'chat-1', provider: AccountProvider.LINKEDIN },
            { id: 'chat-2', provider: AccountProvider.WHATSAPP },
          ],
          cursor: 'next-cursor',
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await messagingService.listChats({
        accountId: 'acc-1',
        hasUnread: true,
        limit: 20,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats',
        {
          account_id: 'acc-1',
          has_unread: true,
          include_archived: undefined,
          limit: 20,
          cursor: undefined,
        },
        'acc-1',
      );
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getChat', () => {
    it('should get chat by ID', async () => {
      const mockChat = {
        id: 'chat-1',
        provider: AccountProvider.LINKEDIN,
        attendees: [],
      };
      mockHttpClient.get.mockResolvedValue({ data: mockChat });

      const result = await messagingService.getChat('chat-1', 'acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1',
        { account_id: 'acc-1' },
        'acc-1',
      );
      expect(result.id).toBe('chat-1');
    });
  });

  describe('startChat', () => {
    it('should start new chat', async () => {
      const mockChat = {
        id: 'chat-1',
        provider: AccountProvider.LINKEDIN,
        attendees: [{ id: 'user-1', name: 'User One' }],
      };
      mockHttpClient.post.mockResolvedValue({ data: mockChat });

      const result = await messagingService.startChat({
        accountId: 'acc-1',
        attendeeIds: ['user-1'],
        message: 'Hello!',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats',
        {
          account_id: 'acc-1',
          attendee_ids: ['user-1'],
          message: 'Hello!',
          attachments: undefined,
        },
        'acc-1',
      );
      expect(result.id).toBe('chat-1');
    });
  });

  describe('listMessages', () => {
    it('should list messages with pagination', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 'msg-1', text: 'Hello' },
            { id: 'msg-2', text: 'Hi there' },
          ],
          cursor: 'next-cursor',
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await messagingService.listMessages({
        chatId: 'chat-1',
        accountId: 'acc-1',
        limit: 50,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages',
        {
          before: undefined,
          after: undefined,
          limit: 50,
          cursor: undefined,
        },
        'acc-1',
      );
      expect(result.items).toHaveLength(2);
    });
  });

  describe('sendMessage', () => {
    it('should send message to chat', async () => {
      const mockMessage = {
        id: 'msg-1',
        chatId: 'chat-1',
        text: 'Hello!',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockMessage });

      const result = await messagingService.sendMessage({
        chatId: 'chat-1',
        accountId: 'acc-1',
        text: 'Hello!',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages',
        {
          text: 'Hello!',
          attachments: undefined,
          reply_to: undefined,
        },
        'acc-1',
      );
      expect(result.text).toBe('Hello!');
    });
  });

  describe('listAttendees', () => {
    it('should list chat attendees', async () => {
      const mockAttendees = [
        { id: 'user-1', name: 'User One' },
        { id: 'user-2', name: 'User Two' },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { items: mockAttendees } });

      const result = await messagingService.listAttendees('chat-1', 'acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/attendees',
        {},
        'acc-1',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('sendInMail', () => {
    it('should send LinkedIn InMail', async () => {
      const mockMessage = {
        id: 'inmail-1',
        text: 'InMail content',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockMessage });

      const result = await messagingService.sendInMail({
        accountId: 'linkedin-acc-1',
        recipientUrn: 'urn:li:person:12345',
        subject: 'InMail Subject',
        body: 'InMail content',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/inmail',
        {
          account_id: 'linkedin-acc-1',
          recipient_urn: 'urn:li:person:12345',
          subject: 'InMail Subject',
          body: 'InMail content',
        },
        'linkedin-acc-1',
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getInMailCredits', () => {
    it('should get InMail credit balance', async () => {
      const mockCredits = {
        available: 50,
        used: 10,
        total: 60,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockCredits });

      const result = await messagingService.getInMailCredits('linkedin-acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/inmail/credits',
        { account_id: 'linkedin-acc-1' },
        'linkedin-acc-1',
      );
      expect(result.available).toBe(50);
    });
  });

  describe('chat management methods', () => {
    beforeEach(() => {
      mockHttpClient.post.mockResolvedValue({ data: undefined });
    });

    it('should mark chat as read', async () => {
      await messagingService.markChatAsRead('chat-1', 'acc-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/read',
        { account_id: 'acc-1' },
        'acc-1',
      );
    });

    it('should archive chat', async () => {
      await messagingService.archiveChat('chat-1', 'acc-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/archive',
        { account_id: 'acc-1' },
        'acc-1',
      );
    });

    it('should unarchive chat', async () => {
      await messagingService.unarchiveChat('chat-1', 'acc-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/unarchive',
        { account_id: 'acc-1' },
        'acc-1',
      );
    });

    it('should mute chat', async () => {
      await messagingService.muteChat('chat-1', 'acc-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/mute',
        { account_id: 'acc-1' },
        'acc-1',
      );
    });

    it('should unmute chat', async () => {
      await messagingService.unmuteChat('chat-1', 'acc-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/unmute',
        { account_id: 'acc-1' },
        'acc-1',
      );
    });
  });

  describe('reactions', () => {
    it('should add reaction to message', async () => {
      mockHttpClient.post.mockResolvedValue({ data: undefined });

      await messagingService.addReaction('chat-1', 'msg-1', '👍');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages/msg-1/reactions',
        { emoji: '👍' },
      );
    });

    it('should remove reaction from message', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: undefined });

      await messagingService.removeReaction('chat-1', 'msg-1', '👍');

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages/msg-1/reactions?emoji=%F0%9F%91%8D',
      );
    });
  });

  describe('listChats alternative response formats', () => {
    it('should handle chats field instead of items', async () => {
      const mockChats = [
        { id: 'chat-1', provider: AccountProvider.LINKEDIN },
        { id: 'chat-2', provider: AccountProvider.WHATSAPP },
      ];
      mockHttpClient.get.mockResolvedValue({
        data: { chats: mockChats, next_cursor: 'cursor-123' },
      });

      const result = await messagingService.listChats({ accountId: 'acc-1' });

      expect(result.items).toEqual(mockChats);
      expect(result.cursor).toBe('cursor-123');
    });

    it('should return empty array when no items or chats field', async () => {
      mockHttpClient.get.mockResolvedValue({ data: {} });

      const result = await messagingService.listChats({ accountId: 'acc-1' });

      expect(result.items).toEqual([]);
      expect(result.cursor).toBeNull();
    });
  });

  describe('listChats with all filter options', () => {
    it('should apply all filter parameters', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { items: [], cursor: null },
      });

      await messagingService.listChats({
        accountId: 'acc-1',
        hasUnread: true,
        includeArchived: true,
        limit: 50,
        cursor: 'cursor-abc',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats',
        {
          account_id: 'acc-1',
          has_unread: true,
          include_archived: true,
          limit: 50,
          cursor: 'cursor-abc',
        },
        'acc-1',
      );
    });
  });

  describe('listMessages alternative response formats', () => {
    it('should handle messages field instead of items', async () => {
      const mockMessages = [
        { id: 'msg-1', text: 'Hello' },
        { id: 'msg-2', text: 'Hi' },
      ];
      mockHttpClient.get.mockResolvedValue({
        data: { messages: mockMessages, next_cursor: 'cursor-456' },
      });

      const result = await messagingService.listMessages({ chatId: 'chat-1', accountId: 'acc-1' });

      expect(result.items).toEqual(mockMessages);
      expect(result.cursor).toBe('cursor-456');
    });

    it('should return empty array when no items or messages field', async () => {
      mockHttpClient.get.mockResolvedValue({ data: {} });

      const result = await messagingService.listMessages({ chatId: 'chat-1', accountId: 'acc-1' });

      expect(result.items).toEqual([]);
      expect(result.cursor).toBeNull();
    });
  });

  describe('listMessages with all filter options', () => {
    it('should apply before and after filters', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { items: [], cursor: null },
      });

      await messagingService.listMessages({
        chatId: 'chat-1',
        accountId: 'acc-1',
        before: '2024-01-15T00:00:00Z',
        after: '2024-01-01T00:00:00Z',
        limit: 100,
        cursor: 'cursor-xyz',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages',
        {
          before: '2024-01-15T00:00:00Z',
          after: '2024-01-01T00:00:00Z',
          limit: 100,
          cursor: 'cursor-xyz',
        },
        'acc-1',
      );
    });
  });

  describe('listAttendees alternative response format', () => {
    it('should handle attendees field instead of items', async () => {
      const mockAttendees = [
        { id: 'user-1', name: 'User One' },
        { id: 'user-2', name: 'User Two' },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { attendees: mockAttendees } });

      const result = await messagingService.listAttendees('chat-1', 'acc-1');

      expect(result).toEqual(mockAttendees);
    });

    it('should return empty array when no items or attendees field', async () => {
      mockHttpClient.get.mockResolvedValue({ data: {} });

      const result = await messagingService.listAttendees('chat-1', 'acc-1');

      expect(result).toEqual([]);
    });
  });

  describe('startChat with attachments', () => {
    it('should start chat with attachments', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: { id: 'chat-1', provider: AccountProvider.WHATSAPP },
      });

      await messagingService.startChat({
        accountId: 'acc-1',
        attendeeIds: ['user-1'],
        message: 'Check this out!',
        attachments: [
          {
            filename: 'image.png',
            contentType: 'image/png',
            content: 'base64-encoded-image',
          },
        ],
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats',
        {
          account_id: 'acc-1',
          attendee_ids: ['user-1'],
          message: 'Check this out!',
          attachments: [
            {
              filename: 'image.png',
              content_type: 'image/png',
              content: 'base64-encoded-image',
            },
          ],
        },
        'acc-1',
      );
    });
  });

  describe('sendMessage with attachments and reply', () => {
    it('should send message with attachments', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: { id: 'msg-1', text: 'See attached' },
      });

      await messagingService.sendMessage({
        chatId: 'chat-1',
        accountId: 'acc-1',
        text: 'See attached',
        attachments: [
          {
            filename: 'doc.pdf',
            contentType: 'application/pdf',
            content: 'base64-pdf-content',
          },
        ],
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages',
        {
          text: 'See attached',
          attachments: [
            {
              filename: 'doc.pdf',
              content_type: 'application/pdf',
              content: 'base64-pdf-content',
            },
          ],
          reply_to: undefined,
        },
        'acc-1',
      );
    });

    it('should send reply to message', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: { id: 'msg-2', text: 'Reply text' },
      });

      await messagingService.sendMessage({
        chatId: 'chat-1',
        accountId: 'acc-1',
        text: 'Reply text',
        replyTo: 'msg-1',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages',
        {
          text: 'Reply text',
          attachments: undefined,
          reply_to: 'msg-1',
        },
        'acc-1',
      );
    });
  });

  describe('getMessage', () => {
    it('should get specific message by ID', async () => {
      const mockMessage = { id: 'msg-1', text: 'Hello', chatId: 'chat-1' };
      mockHttpClient.get.mockResolvedValue({ data: mockMessage });

      const result = await messagingService.getMessage('chat-1', 'msg-1', 'acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages/msg-1',
        {},
        'acc-1',
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getAttendeePicture', () => {
    it('should get attendee profile picture URL', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { url: 'https://example.com/picture.jpg' },
      });

      const result = await messagingService.getAttendeePicture('chat-1', 'user-1', 'acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/attendees/user-1/picture',
        {},
        'acc-1',
      );
      expect(result).toBe('https://example.com/picture.jpg');
    });
  });

  describe('forwardMessage', () => {
    it('should forward message to another chat', async () => {
      const mockMessage = { id: 'msg-forward', text: 'Forwarded' };
      mockHttpClient.post.mockResolvedValue({ data: mockMessage });

      const result = await messagingService.forwardMessage('chat-1', 'msg-1', 'chat-2');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/chats/chat-1/messages/msg-1/forward',
        { target_chat_id: 'chat-2' },
      );
      expect(result).toEqual(mockMessage);
    });
  });
});
