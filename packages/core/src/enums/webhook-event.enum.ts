/**
 * Webhook event types for real-time notifications.
 */
export enum WebhookEvent {
  /** New message received */
  MESSAGE_RECEIVED = 'message_received',

  /** Email successfully sent */
  MAIL_SENT = 'mail_sent',

  /** Email opened by recipient */
  MAIL_OPENED = 'mail_opened',

  /** Link in email clicked */
  LINK_CLICKED = 'link_clicked',

  /** Account connection status changed */
  ACCOUNT_STATUS_CHANGED = 'account_status_changed',
}
