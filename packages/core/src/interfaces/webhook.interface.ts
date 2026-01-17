import type { WebhookSource, WebhookEvent } from '../enums/index.js';

/**
 * Webhook configuration.
 */
export interface Webhook {
  /** Unique webhook identifier */
  id: string;

  /** Webhook URL endpoint */
  url: string;

  /** Event source */
  source: WebhookSource;

  /** Subscribed events */
  events: WebhookEvent[];

  /** Whether webhook is active */
  isActive: boolean;

  /** Creation timestamp */
  createdAt: string;

  /** Last triggered timestamp */
  lastTriggeredAt?: string;

  /** Custom headers to send */
  headers?: Record<string, string>;

  /** Account IDs to filter (empty = all accounts) */
  accountIds?: string[];

  /** Secret for signature verification */
  secret?: string;
}

/**
 * Create webhook request.
 */
export interface CreateWebhookRequest {
  /** Webhook URL endpoint */
  url: string;

  /** Event source */
  source: WebhookSource;

  /** Events to subscribe to */
  events: WebhookEvent[];

  /** Custom headers to include in webhook requests */
  headers?: Record<string, string>;

  /** Account IDs to filter events (empty = all) */
  accountIds?: string[];

  /** Secret for HMAC signature verification */
  secret?: string;
}

/**
 * Webhook payload for message_received event.
 */
export interface MessageReceivedPayload {
  /** Event type */
  event: WebhookEvent.MESSAGE_RECEIVED;

  /** Timestamp */
  timestamp: string;

  /** Account ID */
  accountId: string;

  /** Chat ID */
  chatId: string;

  /** Message ID */
  messageId: string;

  /** Sender information */
  sender: {
    id: string;
    name: string;
  };

  /** Message text */
  text?: string;

  /** Has attachments */
  hasAttachments: boolean;
}

/**
 * Webhook payload for mail_sent event.
 */
export interface MailSentPayload {
  /** Event type */
  event: WebhookEvent.MAIL_SENT;

  /** Timestamp */
  timestamp: string;

  /** Account ID */
  accountId: string;

  /** Email ID */
  emailId: string;

  /** Message ID header */
  messageId: string;

  /** Recipients */
  to: string[];

  /** Subject */
  subject: string;
}

/**
 * Webhook payload for mail_opened event.
 */
export interface MailOpenedPayload {
  /** Event type */
  event: WebhookEvent.MAIL_OPENED;

  /** Timestamp */
  timestamp: string;

  /** Account ID */
  accountId: string;

  /** Email ID */
  emailId: string;

  /** Open count */
  openCount: number;

  /** IP address (if available) */
  ipAddress?: string;

  /** User agent (if available) */
  userAgent?: string;
}

/**
 * Webhook payload for link_clicked event.
 */
export interface LinkClickedPayload {
  /** Event type */
  event: WebhookEvent.LINK_CLICKED;

  /** Timestamp */
  timestamp: string;

  /** Account ID */
  accountId: string;

  /** Email ID */
  emailId: string;

  /** Clicked URL */
  url: string;

  /** Click count for this URL */
  clickCount: number;
}

/**
 * Webhook payload for account_status_changed event.
 */
export interface AccountStatusChangedPayload {
  /** Event type */
  event: WebhookEvent.ACCOUNT_STATUS_CHANGED;

  /** Timestamp */
  timestamp: string;

  /** Account ID */
  accountId: string;

  /** Previous status */
  previousStatus: string;

  /** New status */
  newStatus: string;

  /** Error message (if status is ERROR) */
  errorMessage?: string;
}

/**
 * Union type for all webhook payloads.
 */
export type WebhookPayload =
  | MessageReceivedPayload
  | MailSentPayload
  | MailOpenedPayload
  | LinkClickedPayload
  | AccountStatusChangedPayload;

/**
 * Webhook delivery record.
 */
export interface WebhookDelivery {
  /** Delivery ID */
  id: string;

  /** Webhook ID */
  webhookId: string;

  /** Event type */
  event: WebhookEvent;

  /** Request payload */
  payload: WebhookPayload;

  /** Response status code */
  statusCode?: number;

  /** Response body */
  responseBody?: string;

  /** Delivery timestamp */
  deliveredAt: string;

  /** Whether delivery succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}
