import type { Attachment, PaginationOptions } from './common.interface.js';

/**
 * Email recipient address.
 */
export interface EmailAddress {
  /** Email address */
  email: string;

  /** Display name */
  name?: string;
}

/**
 * Email message representation.
 */
export interface Email {
  /** Unique email identifier */
  id: string;

  /** Account ID this email belongs to */
  accountId: string;

  /** Email subject */
  subject: string;

  /** Sender address */
  from: EmailAddress;

  /** Primary recipients */
  to: EmailAddress[];

  /** CC recipients */
  cc?: EmailAddress[];

  /** BCC recipients */
  bcc?: EmailAddress[];

  /** Plain text body */
  body?: string;

  /** HTML body */
  bodyHtml?: string;

  /** Email attachments */
  attachments?: Attachment[];

  /** Received/sent timestamp */
  date: string;

  /** Email folder */
  folder: string;

  /** Read status */
  isRead: boolean;

  /** Starred/flagged status */
  isStarred: boolean;

  /** Draft status */
  isDraft: boolean;

  /** Thread/conversation ID */
  threadId?: string;

  /** In-Reply-To header value */
  inReplyTo?: string;

  /** Message-ID header value */
  messageId?: string;

  /** Email tracking data */
  tracking?: EmailTracking;
}

/**
 * Email tracking information.
 */
export interface EmailTracking {
  /** Whether tracking is enabled */
  enabled: boolean;

  /** Number of times email was opened */
  openCount: number;

  /** Last opened timestamp */
  lastOpenedAt?: string;

  /** Link click events */
  clicks?: LinkClick[];
}

/**
 * Link click tracking event.
 */
export interface LinkClick {
  /** Clicked URL */
  url: string;

  /** Click timestamp */
  clickedAt: string;

  /** Number of clicks */
  count: number;
}

/**
 * Send email request.
 */
export interface SendEmailRequest {
  /** Account ID to send from */
  accountId: string;

  /** Recipient email addresses */
  to: EmailAddress[];

  /** Email subject */
  subject: string;

  /** Plain text body */
  body?: string;

  /** HTML body */
  bodyHtml?: string;

  /** CC recipients */
  cc?: EmailAddress[];

  /** BCC recipients */
  bcc?: EmailAddress[];

  /** Email attachments */
  attachments?: Attachment[];

  /** Message ID to reply to (for threading) */
  replyTo?: string;

  /** Enable open/click tracking */
  tracking?: boolean;

  /** Schedule send time (ISO 8601) */
  scheduledAt?: string;
}

/**
 * Update email request.
 */
export interface UpdateEmailRequest {
  /** Mark as read/unread */
  isRead?: boolean;

  /** Mark as starred/unstarred */
  isStarred?: boolean;

  /** Move to folder */
  folder?: string;
}

/**
 * Email folder representation.
 */
export interface EmailFolder {
  /** Folder identifier */
  id: string;

  /** Folder display name */
  name: string;

  /** Folder type (inbox, sent, drafts, etc.) */
  type: string;

  /** Unread email count */
  unreadCount: number;

  /** Total email count */
  totalCount: number;

  /** Parent folder ID (for nested folders) */
  parentId?: string;
}

/**
 * List emails request options.
 */
export interface ListEmailsOptions extends PaginationOptions {
  /** Account ID */
  accountId: string;

  /** Filter by folder */
  folder?: string;

  /** Filter by read status */
  isRead?: boolean;

  /** Filter by starred status */
  isStarred?: boolean;

  /** Search query */
  query?: string;

  /** Filter by date range */
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Create draft request.
 */
export interface CreateDraftRequest {
  /** Account ID */
  accountId: string;

  /** Recipient email addresses */
  to?: EmailAddress[];

  /** Email subject */
  subject?: string;

  /** Plain text body */
  body?: string;

  /** HTML body */
  bodyHtml?: string;

  /** CC recipients */
  cc?: EmailAddress[];

  /** BCC recipients */
  bcc?: EmailAddress[];

  /** Email attachments */
  attachments?: Attachment[];
}
