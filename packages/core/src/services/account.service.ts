import type { HttpClient } from '../http/http-client.js';
import type {
  Account,
  OAuthConnectRequest,
  CredentialsConnectRequest,
  CookieConnectRequest,
  QrCodeConnectRequest,
  ImapConnectRequest,
  Checkpoint,
  CheckpointResolveRequest,
  HostedAuthLink,
  CreateHostedAuthLinkRequest,
  ReconnectAccountRequest,
  PaginatedResponse,
  PaginationOptions,
} from '../interfaces/index.js';

/**
 * Service for managing Unipile accounts.
 * Handles account connections, authentication flows, and lifecycle operations.
 */
export class AccountService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Lists all connected accounts.
   * @param options - Pagination options
   * @returns Paginated list of accounts
   */
  async list(options: PaginationOptions = {}): Promise<PaginatedResponse<Account>> {
    const response = await this.httpClient.get<PaginatedResponse<Account>>('/api/v1/accounts', {
      limit: options.limit,
      cursor: options.cursor,
    });
    return response.data;
  }

  /**
   * Gets a specific account by ID.
   * @param accountId - Account identifier
   * @returns Account details
   */
  async get(accountId: string): Promise<Account> {
    const response = await this.httpClient.get<Account>(`/api/v1/accounts/${accountId}`);
    return response.data;
  }

  /**
   * Connects an account using OAuth authorization code.
   * @param request - OAuth connection parameters
   * @returns Connected account or checkpoint for 2FA
   */
  async connectOAuth(request: OAuthConnectRequest): Promise<Account | Checkpoint> {
    const response = await this.httpClient.post<Account | Checkpoint>('/api/v1/accounts', {
      provider: request.provider,
      code: request.code,
      redirect_uri: request.redirectUri,
    });
    return response.data;
  }

  /**
   * Connects an account using credentials (username/password).
   * @param request - Credentials connection parameters
   * @returns Connected account or checkpoint for 2FA
   */
  async connectCredentials(request: CredentialsConnectRequest): Promise<Account | Checkpoint> {
    const response = await this.httpClient.post<Account | Checkpoint>('/api/v1/accounts', {
      provider: request.provider,
      username: request.username,
      password: request.password,
    });
    return response.data;
  }

  /**
   * Connects an account using session cookies.
   * @param request - Cookie connection parameters
   * @returns Connected account or checkpoint for 2FA
   */
  async connectCookies(request: CookieConnectRequest): Promise<Account | Checkpoint> {
    const response = await this.httpClient.post<Account | Checkpoint>('/api/v1/accounts', {
      provider: request.provider,
      cookies: request.cookies,
    });
    return response.data;
  }

  /**
   * Initiates QR code-based connection (e.g., WhatsApp).
   * @param request - QR code connection parameters
   * @returns Checkpoint containing QR code data
   */
  async connectQrCode(request: QrCodeConnectRequest): Promise<Checkpoint> {
    const response = await this.httpClient.post<Checkpoint>('/api/v1/accounts', {
      provider: request.provider,
      connection_type: 'qr_code',
    });
    return response.data;
  }

  /**
   * Connects a generic IMAP email account.
   * @param request - IMAP connection parameters
   * @returns Connected account
   */
  async connectImap(request: ImapConnectRequest): Promise<Account> {
    const response = await this.httpClient.post<Account>('/api/v1/accounts', {
      provider: request.provider,
      imap_host: request.imapHost,
      imap_port: request.imapPort,
      smtp_host: request.smtpHost,
      smtp_port: request.smtpPort,
      email: request.email,
      password: request.password,
      use_ssl: request.useSsl ?? true,
    });
    return response.data;
  }

  /**
   * Resolves a checkpoint (2FA verification).
   * @param request - Checkpoint resolution parameters
   * @returns Connected account
   */
  async resolveCheckpoint(request: CheckpointResolveRequest): Promise<Account> {
    const response = await this.httpClient.post<Account>(
      `/api/v1/accounts/${request.accountId}/checkpoint`,
      {
        type: request.type,
        code: request.code,
        captcha_solution: request.captchaSolution,
      },
    );
    return response.data;
  }

  /**
   * Creates a hosted authentication link for user-directed OAuth.
   * @param request - Hosted auth link parameters
   * @returns Hosted authentication URL
   */
  async createHostedAuthLink(request: CreateHostedAuthLinkRequest): Promise<HostedAuthLink> {
    const response = await this.httpClient.post<HostedAuthLink>('/api/v1/hosted/accounts/link', {
      provider: request.provider,
      callback_url: request.callbackUrl,
      expires_in: request.expiresIn,
      state: request.state,
    });
    return response.data;
  }

  /**
   * Reconnects a disconnected account.
   * @param request - Reconnection parameters
   * @returns Reconnected account or checkpoint for 2FA
   */
  async reconnect(request: ReconnectAccountRequest): Promise<Account | Checkpoint> {
    const response = await this.httpClient.post<Account | Checkpoint>(
      `/api/v1/accounts/${request.accountId}/reconnect`,
    );
    return response.data;
  }

  /**
   * Deletes an account connection.
   * @param accountId - Account identifier
   */
  async delete(accountId: string): Promise<void> {
    await this.httpClient.delete(`/api/v1/accounts/${accountId}`);
  }

  /**
   * Resynchronizes account data (for messaging accounts).
   * @param accountId - Account identifier
   */
  async resync(accountId: string): Promise<void> {
    await this.httpClient.post(`/api/v1/accounts/${accountId}/resync`, undefined, accountId);
  }

  /**
   * Checks if an account response is a checkpoint requiring verification.
   * @param response - Account or checkpoint response
   * @returns True if checkpoint, false if account
   */
  isCheckpoint(response: Account | Checkpoint): response is Checkpoint {
    return 'type' in response && 'message' in response && !('status' in response);
  }
}
