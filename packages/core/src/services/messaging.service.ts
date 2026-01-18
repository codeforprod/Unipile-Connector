import type { HttpClient } from '../http/http-client.js';
import type {
  Chat,
  Message,
  ChatAttendee,
  StartChatRequest,
  SendMessageRequest,
  ListChatsOptions,
  ListMessagesOptions,
  SendInMailRequest,
  InMailCreditBalance,
  PaginatedResponse,
} from '../interfaces/index.js';

/**
 * API response shape for chat list.
 */
interface ChatListResponse {
  items?: Chat[];
  chats?: Chat[];
  cursor?: string;
  next_cursor?: string;
}

/**
 * API response shape for message list.
 */
interface MessageListResponse {
  items?: Message[];
  messages?: Message[];
  cursor?: string;
  next_cursor?: string;
}

/**
 * API response shape for attendee list.
 */
interface AttendeeListResponse {
  items?: ChatAttendee[];
  attendees?: ChatAttendee[];
}

/**
 * Service for messaging operations across all supported platforms.
 * Handles chats, messages, and LinkedIn-specific messaging features.
 */
export class MessagingService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Lists chats for an account with optional filtering.
   * @param options - List options including filters and pagination
   * @returns Paginated list of chats
   */
  async listChats(options: ListChatsOptions): Promise<PaginatedResponse<Chat>> {
    const response = await this.httpClient.get<ChatListResponse>(
      '/api/v1/chats',
      {
        account_id: options.accountId,
        has_unread: options.hasUnread,
        include_archived: options.includeArchived,
        limit: options.limit,
        cursor: options.cursor,
      },
      options.accountId,
    );

    return {
      items: response.data.items ?? response.data.chats ?? [],
      cursor: response.data.cursor ?? response.data.next_cursor ?? null,
    };
  }

  /**
   * Gets a specific chat by ID.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier
   * @returns Chat details
   */
  async getChat(chatId: string, accountId: string): Promise<Chat> {
    const response = await this.httpClient.get<Chat>(
      `/api/v1/chats/${chatId}`,
      { account_id: accountId },
      accountId,
    );
    return response.data;
  }

  /**
   * Starts a new chat conversation.
   * @param request - Start chat parameters
   * @returns Created chat
   */
  async startChat(request: StartChatRequest): Promise<Chat> {
    const response = await this.httpClient.post<Chat>(
      '/api/v1/chats',
      {
        account_id: request.accountId,
        attendee_ids: request.attendeeIds,
        message: request.message,
        attachments: request.attachments?.map((att) => ({
          filename: att.filename,
          content_type: att.contentType,
          content: att.content,
        })),
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Lists messages in a chat with pagination.
   * @param options - List options including pagination
   * @returns Paginated list of messages
   */
  async listMessages(options: ListMessagesOptions): Promise<PaginatedResponse<Message>> {
    const response = await this.httpClient.get<MessageListResponse>(
      `/api/v1/chats/${options.chatId}/messages`,
      {
        before: options.before,
        after: options.after,
        limit: options.limit,
        cursor: options.cursor,
      },
      options.accountId,
    );

    return {
      items: response.data.items ?? response.data.messages ?? [],
      cursor: response.data.cursor ?? response.data.next_cursor ?? null,
    };
  }

  /**
   * Gets a specific message by ID.
   * @param chatId - Chat identifier
   * @param messageId - Message identifier
   * @param accountId - Account identifier for rate limiting
   * @returns Message details
   */
  async getMessage(chatId: string, messageId: string, accountId: string): Promise<Message> {
    const response = await this.httpClient.get<Message>(
      `/api/v1/chats/${chatId}/messages/${messageId}`,
      {},
      accountId,
    );
    return response.data;
  }

  /**
   * Sends a message to a chat.
   * @param request - Send message parameters
   * @returns Sent message
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const response = await this.httpClient.post<Message>(
      `/api/v1/chats/${request.chatId}/messages`,
      {
        text: request.text,
        attachments: request.attachments?.map((att) => ({
          filename: att.filename,
          content_type: att.contentType,
          content: att.content,
        })),
        reply_to: request.replyTo,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Lists attendees/participants in a chat.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier for rate limiting
   * @returns List of chat attendees
   */
  async listAttendees(chatId: string, accountId: string): Promise<ChatAttendee[]> {
    const response = await this.httpClient.get<AttendeeListResponse>(
      `/api/v1/chats/${chatId}/attendees`,
      {},
      accountId,
    );
    return response.data.items ?? response.data.attendees ?? [];
  }

  /**
   * Gets profile picture URL for an attendee.
   * @param chatId - Chat identifier
   * @param attendeeId - Attendee identifier
   * @param accountId - Account identifier for rate limiting
   * @returns Profile picture URL
   */
  async getAttendeePicture(chatId: string, attendeeId: string, accountId: string): Promise<string> {
    const response = await this.httpClient.get<{ url: string }>(
      `/api/v1/chats/${chatId}/attendees/${attendeeId}/picture`,
      {},
      accountId,
    );
    return response.data.url;
  }

  /**
   * Sends a LinkedIn InMail message.
   * @param request - InMail parameters
   * @returns Sent message details
   */
  async sendInMail(request: SendInMailRequest): Promise<Message> {
    const response = await this.httpClient.post<Message>(
      '/api/v1/linkedin/inmail',
      {
        account_id: request.accountId,
        recipient_urn: request.recipientUrn,
        subject: request.subject,
        body: request.body,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Gets LinkedIn InMail credit balance.
   * @param accountId - LinkedIn account identifier
   * @returns InMail credit balance
   */
  async getInMailCredits(accountId: string): Promise<InMailCreditBalance> {
    const response = await this.httpClient.get<InMailCreditBalance>(
      '/api/v1/linkedin/inmail/credits',
      { account_id: accountId },
      accountId,
    );
    return response.data;
  }

  /**
   * Marks a chat as read.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier
   */
  async markChatAsRead(chatId: string, accountId: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/chats/${chatId}/read`,
      { account_id: accountId },
      accountId,
    );
  }

  /**
   * Archives a chat.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier
   */
  async archiveChat(chatId: string, accountId: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/chats/${chatId}/archive`,
      { account_id: accountId },
      accountId,
    );
  }

  /**
   * Unarchives a chat.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier
   */
  async unarchiveChat(chatId: string, accountId: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/chats/${chatId}/unarchive`,
      { account_id: accountId },
      accountId,
    );
  }

  /**
   * Mutes a chat.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier
   */
  async muteChat(chatId: string, accountId: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/chats/${chatId}/mute`,
      { account_id: accountId },
      accountId,
    );
  }

  /**
   * Unmutes a chat.
   * @param chatId - Chat identifier
   * @param accountId - Account identifier
   */
  async unmuteChat(chatId: string, accountId: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/chats/${chatId}/unmute`,
      { account_id: accountId },
      accountId,
    );
  }

  /**
   * Adds a reaction to a message.
   * @param chatId - Chat identifier
   * @param messageId - Message identifier
   * @param emoji - Reaction emoji
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    await this.httpClient.post(`/api/v1/chats/${chatId}/messages/${messageId}/reactions`, {
      emoji,
    });
  }

  /**
   * Removes a reaction from a message.
   * @param chatId - Chat identifier
   * @param messageId - Message identifier
   * @param emoji - Reaction emoji to remove
   */
  async removeReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    await this.httpClient.delete(
      `/api/v1/chats/${chatId}/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`,
    );
  }

  /**
   * Forwards a message to another chat.
   * @param chatId - Source chat identifier
   * @param messageId - Message identifier to forward
   * @param targetChatId - Destination chat identifier
   * @returns Forwarded message
   */
  async forwardMessage(chatId: string, messageId: string, targetChatId: string): Promise<Message> {
    const response = await this.httpClient.post<Message>(
      `/api/v1/chats/${chatId}/messages/${messageId}/forward`,
      { target_chat_id: targetChatId },
    );
    return response.data;
  }
}
