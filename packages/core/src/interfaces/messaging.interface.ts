import type { Attachment, PaginationOptions } from './common.interface.js';
import type { AccountProvider } from '../enums/index.js';

/**
 * Chat participant/attendee.
 */
export interface ChatAttendee {
  /** Unique participant identifier */
  id: string;

  /** Participant display name */
  name: string;

  /** Participant username/handle */
  username?: string;

  /** Profile picture URL */
  pictureUrl?: string;

  /** Provider-specific identifier */
  providerId?: string;

  /** Whether this is the current user */
  isMe?: boolean;
}

/**
 * Chat/conversation representation.
 */
export interface Chat {
  /** Unique chat identifier */
  id: string;

  /** Account ID this chat belongs to */
  accountId: string;

  /** Chat provider */
  provider: AccountProvider;

  /** Chat name (for group chats) */
  name?: string;

  /** Chat participants */
  attendees: ChatAttendee[];

  /** Last message in chat */
  lastMessage?: Message;

  /** Unread message count */
  unreadCount: number;

  /** Chat creation timestamp */
  createdAt: string;

  /** Last activity timestamp */
  updatedAt: string;

  /** Whether this is a group chat */
  isGroup: boolean;

  /** Whether chat is muted */
  isMuted?: boolean;

  /** Whether chat is archived */
  isArchived?: boolean;
}

/**
 * Chat message representation.
 */
export interface Message {
  /** Unique message identifier */
  id: string;

  /** Chat ID this message belongs to */
  chatId: string;

  /** Message sender */
  sender: ChatAttendee;

  /** Message text content */
  text?: string;

  /** Message attachments */
  attachments?: Attachment[];

  /** Message timestamp */
  timestamp: string;

  /** Whether message is from current user */
  isOutgoing: boolean;

  /** Message read status */
  isRead: boolean;

  /** Message delivery status */
  deliveryStatus?: MessageDeliveryStatus;

  /** Replied message (for threaded replies) */
  replyTo?: Message;

  /** Message reactions */
  reactions?: MessageReaction[];
}

/**
 * Message delivery status.
 */
export type MessageDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Message reaction.
 */
export interface MessageReaction {
  /** Reaction emoji */
  emoji: string;

  /** User who reacted */
  user: ChatAttendee;

  /** Reaction timestamp */
  timestamp: string;
}

/**
 * Start new chat request.
 */
export interface StartChatRequest {
  /** Account ID to use */
  accountId: string;

  /** Participant identifiers (provider-specific) */
  attendeeIds: string[];

  /** Initial message text (optional) */
  message?: string;

  /** Initial attachments (optional) */
  attachments?: Attachment[];
}

/**
 * Send message request.
 */
export interface SendMessageRequest {
  /** Account ID for rate limiting */
  accountId: string;

  /** Chat ID to send to */
  chatId: string;

  /** Message text */
  text?: string;

  /** Message attachments */
  attachments?: Attachment[];

  /** Message ID to reply to */
  replyTo?: string;
}

/**
 * List chats request options.
 */
export interface ListChatsOptions extends PaginationOptions {
  /** Account ID */
  accountId: string;

  /** Filter by unread status */
  hasUnread?: boolean;

  /** Include archived chats */
  includeArchived?: boolean;
}

/**
 * List messages request options.
 */
export interface ListMessagesOptions extends PaginationOptions {
  /** Account ID for rate limiting */
  accountId: string;

  /** Chat ID */
  chatId: string;

  /** Filter messages before this timestamp */
  before?: string;

  /** Filter messages after this timestamp */
  after?: string;
}

/**
 * LinkedIn InMail request.
 */
export interface SendInMailRequest {
  /** Account ID (must be LinkedIn with Sales Navigator) */
  accountId: string;

  /** Recipient LinkedIn profile URN */
  recipientUrn: string;

  /** InMail subject */
  subject: string;

  /** InMail body */
  body: string;
}

/**
 * LinkedIn InMail credit balance.
 */
export interface InMailCreditBalance {
  /** Available InMail credits */
  available: number;

  /** Used InMail credits */
  used: number;

  /** Total InMail credits */
  total: number;

  /** Reset date */
  resetDate?: string;
}
