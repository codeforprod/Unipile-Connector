/**
 * Webhook event sources for real-time notifications.
 */
export enum WebhookSource {
  /** Messaging platform events */
  MESSAGING = 'messaging',

  /** Email events (send, receive) */
  EMAIL = 'email',

  /** Email tracking events (opens, clicks) */
  EMAIL_TRACKING = 'email_tracking',

  /** Account status change events */
  ACCOUNT_STATUS = 'account_status',
}
