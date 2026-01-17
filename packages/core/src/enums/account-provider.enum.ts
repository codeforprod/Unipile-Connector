/**
 * Supported account providers for messaging and email integration.
 */
export enum AccountProvider {
  /** LinkedIn messaging and Sales Navigator */
  LINKEDIN = 'LINKEDIN',

  /** WhatsApp messaging */
  WHATSAPP = 'WHATSAPP',

  /** Instagram Direct messaging */
  INSTAGRAM = 'INSTAGRAM',

  /** Facebook Messenger */
  MESSENGER = 'MESSENGER',

  /** Telegram messaging */
  TELEGRAM = 'TELEGRAM',

  /** Twitter/X Direct Messages */
  TWITTER = 'TWITTER',

  /** Slack workspace messaging */
  SLACK = 'SLACK',

  /** Gmail email (OAuth) */
  GMAIL = 'GMAIL',

  /** Outlook email (OAuth) */
  OUTLOOK = 'OUTLOOK',

  /** iCloud email */
  ICLOUD = 'ICLOUD',

  /** Microsoft Exchange email */
  EXCHANGE = 'EXCHANGE',

  /** Generic IMAP email provider */
  IMAP = 'IMAP',
}
