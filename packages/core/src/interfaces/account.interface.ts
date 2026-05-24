import type { AccountStatus, AccountProvider, CheckpointType } from '../enums/index.js';

/**
 * Unipile account representation.
 */
export interface Account {
  /** Unique account identifier */
  id: string;

  /** Account provider type */
  provider: AccountProvider;

  /** Current connection status */
  status: AccountStatus;

  /** Account display name */
  name: string;

  /** Associated email address */
  email?: string;

  /** Account creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Last successful sync timestamp */
  lastSyncAt?: string;

  /** Provider-specific account ID */
  providerId?: string;

  /** Account profile picture URL */
  pictureUrl?: string;
}

/**
 * Account connection request for OAuth-based providers.
 */
export interface OAuthConnectRequest {
  /** Account provider */
  provider: AccountProvider;

  /** OAuth authorization code */
  code: string;

  /** OAuth redirect URI used */
  redirectUri: string;
}

/**
 * Account connection request for credential-based providers.
 */
export interface CredentialsConnectRequest {
  /** Account provider */
  provider: AccountProvider;

  /** Login username or email */
  username: string;

  /** Account password */
  password: string;
}

/**
 * Account connection request for cookie-based providers.
 */
export interface CookieConnectRequest {
  /** Account provider */
  provider: AccountProvider;

  /** Session cookies (JSON format) */
  cookies: string;
}

/**
 * Account connection request for QR code-based providers (WhatsApp).
 */
export interface QrCodeConnectRequest {
  /** Account provider */
  provider: AccountProvider;
}

/**
 * IMAP connection request for generic email providers.
 */
export interface ImapConnectRequest {
  /** Account provider (IMAP) */
  provider: AccountProvider.IMAP;

  /** IMAP server hostname */
  imapHost: string;

  /** IMAP server port */
  imapPort: number;

  /** SMTP server hostname */
  smtpHost: string;

  /** SMTP server port */
  smtpPort: number;

  /** Email address */
  email: string;

  /** Email password or app password */
  password: string;

  /** Use SSL/TLS */
  useSsl?: boolean;
}

/**
 * Checkpoint response for 2FA flows.
 */
export interface Checkpoint {
  /** Checkpoint type */
  type: CheckpointType;

  /** Account ID being verified */
  accountId: string;

  /** Instructions for user */
  message: string;

  /** QR code data URL (for CAPTCHA) */
  qrCode?: string;

  /** Expiration timestamp */
  expiresAt?: string;
}

/**
 * Checkpoint resolution request.
 */
export interface CheckpointResolveRequest {
  /** Account ID */
  accountId: string;

  /** Checkpoint type being resolved */
  type: CheckpointType;

  /** Verification code (for OTP) */
  code?: string;

  /** CAPTCHA solution */
  captchaSolution?: string;
}

/**
 * Hosted authentication link response.
 */
export interface HostedAuthLink {
  /** Generated authentication URL */
  url: string;

  /** Link expiration timestamp */
  expiresAt: string;
}

/**
 * Hosted authentication link request.
 */
export interface CreateHostedAuthLinkRequest {
  /** Account provider */
  provider: AccountProvider;

  /** Callback URL after authentication */
  callbackUrl: string;

  /** Optional expiration duration in seconds */
  expiresIn?: number;

  /** Custom state parameter */
  state?: string;
}

/**
 * Account reconnection request.
 */
export interface ReconnectAccountRequest {
  /** Account ID to reconnect */
  accountId: string;
}

/**
 * v2 auth intent type.
 */
export type AuthIntentType = 'create' | 'reconnect';

/**
 * v2 native authentication intent request.
 */
export interface CreateAuthIntentRequest {
  /** Create a new account connection or reconnect an existing one. */
  type?: AuthIntentType;

  /** Account provider. */
  provider?: AccountProvider | string;

  /** Existing account ID for reconnect intents. */
  accountId?: string;

  /** Login username or email for credential-based flows. */
  username?: string;

  /** Account password for credential-based flows. */
  password?: string;

  /** Session cookies for cookie-based flows. */
  cookies?: string;

  /** OAuth authorization code. */
  code?: string;

  /** OAuth redirect URI. */
  redirectUri?: string;

  /** Additional provider-specific v2 auth intent fields. */
  payload?: Record<string, unknown>;
}

/**
 * v2 authentication intent response.
 */
export interface AuthIntent {
  /** Intent identifier used for follow-up checkpoint calls. */
  id: string;

  /** Alternate intent identifier returned by some API shapes. */
  intentId?: string;

  /** Connected account ID when available. */
  accountId?: string;

  /** Intent status. */
  status?: string;

  /** Optional checkpoint details. */
  checkpoint?: Checkpoint;

  /** Raw v2 response fields preserved for forward compatibility. */
  raw?: Record<string, unknown>;
}

/**
 * v2 hosted authentication link request.
 */
export interface CreateAuthLinkRequest {
  /** Create or reconnect flow. */
  type: AuthIntentType;

  /** Providers available in the hosted auth flow. */
  providers: Array<AccountProvider | string> | '*';

  /** Existing account ID for reconnect links. */
  accountId?: string;

  /** API URL shown to the hosted auth flow when required. */
  apiUrl?: string;

  /** Link expiration date/time in ISO 8601 format. */
  expiresOn?: string;

  /** Success redirect URL. */
  successRedirectUrl?: string;

  /** Failure redirect URL. */
  failureRedirectUrl?: string;

  /** Backend notification URL. */
  notifyUrl?: string;

  /** Caller-owned correlation value. */
  name?: string;

  /** Additional v2 hosted auth fields. */
  payload?: Record<string, unknown>;
}

/**
 * v2 hosted authentication link response.
 */
export interface AuthLink {
  /** Generated hosted auth URL. */
  url: string;

  /** Raw object type when returned by Unipile. */
  object?: string;

  /** Raw v2 response fields preserved for forward compatibility. */
  raw?: Record<string, unknown>;
}

/**
 * v2 checkpoint resolution request.
 */
export interface ResolveAuthCheckpointRequest {
  /** v2 auth intent identifier. */
  intentId: string;

  /** Verification code for OTP flows. */
  code?: string;

  /** CAPTCHA solution token. */
  captchaSolution?: string;

  /** Additional v2 checkpoint fields. */
  payload?: Record<string, unknown>;
}
