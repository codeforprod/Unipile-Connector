/**
 * Supported Unipile API route families.
 */
export type UnipileApiVersion = 'v1' | 'v2';

/**
 * Default v2 API base URL.
 */
export const DEFAULT_V2_API_BASE_URL = 'https://api.unipile.com/v2';

/**
 * Configuration options for the Unipile client.
 */
export interface UnipileConfig {
  /**
   * Unipile API DSN (domain:port format).
   * Required for v1 mode unless apiBaseUrl is provided.
   * @example "api6.unipile.com:13624"
   */
  dsn?: string;

  /**
   * Explicit API base URL.
   * In v2 mode this defaults to https://api.unipile.com/v2.
   * @example "https://api.unipile.com/v2"
   */
  apiBaseUrl?: string;

  /**
   * API route family to target.
   * @default "v1"
   */
  apiVersion?: UnipileApiVersion;

  /**
   * Unipile API access token.
   */
  apiKey: string;

  /**
   * Use HTTP instead of HTTPS.
   * @default false
   */
  useHttp?: boolean;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Enable automatic retry with exponential backoff.
   * @default true
   */
  enableRetry?: boolean;

  /**
   * Base delay for exponential backoff in milliseconds.
   * @default 300000 (5 minutes)
   */
  retryBaseDelay?: number;

  /**
   * Maximum delay for exponential backoff in milliseconds.
   * @default 7200000 (2 hours)
   */
  retryMaxDelay?: number;

  /**
   * Maximum number of retry attempts.
   * @default 5
   */
  maxRetries?: number;
}

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: Required<Omit<UnipileConfig, 'dsn' | 'apiBaseUrl' | 'apiKey'>> = {
  apiVersion: 'v1',
  useHttp: false,
  timeout: 30000,
  enableRetry: true,
  retryBaseDelay: 300000,
  retryMaxDelay: 7200000,
  maxRetries: 5,
};
