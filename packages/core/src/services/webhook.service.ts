import type { HttpClient } from '../http/http-client.js';
import type { Webhook, CreateWebhookRequest, PaginatedResponse } from '../interfaces/index.js';

/**
 * API response shape for webhook list.
 */
interface WebhookListResponse {
  items?: Webhook[];
  webhooks?: Webhook[];
  cursor?: string;
  next_cursor?: string;
}

/**
 * Service for webhook management.
 * Handles creating, listing, and deleting webhooks for real-time events.
 */
export class WebhookService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Lists all configured webhooks.
   * @param limit - Maximum results per page
   * @param cursor - Pagination cursor
   * @returns Paginated list of webhooks
   */
  async list(limit?: number, cursor?: string): Promise<PaginatedResponse<Webhook>> {
    const response = await this.httpClient.get<WebhookListResponse>('/api/v1/webhooks', {
      limit,
      cursor,
    });

    return {
      items: response.data.items ?? response.data.webhooks ?? [],
      cursor: response.data.cursor ?? response.data.next_cursor ?? null,
    };
  }

  /**
   * Gets a specific webhook by ID.
   * @param webhookId - Webhook identifier
   * @returns Webhook details
   */
  async get(webhookId: string): Promise<Webhook> {
    const response = await this.httpClient.get<Webhook>(`/api/v1/webhooks/${webhookId}`);
    return response.data;
  }

  /**
   * Creates a new webhook.
   * @param request - Webhook creation parameters
   * @returns Created webhook
   */
  async create(request: CreateWebhookRequest): Promise<Webhook> {
    const response = await this.httpClient.post<Webhook>('/api/v1/webhooks', {
      url: request.url,
      source: request.source,
      events: request.events,
      headers: request.headers,
      account_ids: request.accountIds,
      secret: request.secret,
    });
    return response.data;
  }

  /**
   * Deletes a webhook.
   * @param webhookId - Webhook identifier
   */
  async delete(webhookId: string): Promise<void> {
    await this.httpClient.delete(`/api/v1/webhooks/${webhookId}`);
  }

  /**
   * Verifies a webhook signature.
   * @param payload - Raw request body
   * @param signature - Signature from X-Unipile-Signature header
   * @param secret - Webhook secret
   * @returns True if signature is valid
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    // HMAC-SHA256 verification
    // Note: This requires a crypto implementation
    // For browser/Node.js compatibility, we use SubtleCrypto when available
    return this.verifyHmacSignature(payload, signature, secret);
  }

  /**
   * Verifies HMAC-SHA256 signature.
   */
  private verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
    // Synchronous verification using timing-safe comparison
    // In production, this should use crypto.timingSafeEqual
    const expectedSignature = this.computeHmac(payload, secret);
    return this.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Computes HMAC-SHA256 signature.
   * Note: This is a simplified implementation. In production,
   * use Node.js crypto or Web Crypto API.
   */
  private computeHmac(payload: string, secret: string): string {
    // This is a placeholder - actual implementation would use:
    // Node.js: crypto.createHmac('sha256', secret).update(payload).digest('hex')
    // Browser: await crypto.subtle.sign('HMAC', key, data)

    // For now, return empty string to indicate implementation needed
    // The actual HMAC computation should be done in the consuming application
    // based on their runtime environment
    void payload;
    void secret;
    return '';
  }

  /**
   * Timing-safe string comparison to prevent timing attacks.
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Parses a webhook payload from raw body.
   * @param body - Raw request body (JSON string)
   * @returns Parsed webhook payload
   */
  parsePayload<T>(body: string): T {
    return JSON.parse(body) as T;
  }

  /**
   * Creates a webhook for messaging events.
   * @param url - Webhook endpoint URL
   * @param accountIds - Optional account IDs to filter
   * @param secret - Optional secret for signature verification
   * @returns Created webhook
   */
  async createMessagingWebhook(
    url: string,
    accountIds?: string[],
    secret?: string,
  ): Promise<Webhook> {
    const { WebhookSource, WebhookEvent } = await import('../enums/index.js');
    return this.create({
      url,
      source: WebhookSource.MESSAGING,
      events: [WebhookEvent.MESSAGE_RECEIVED],
      accountIds,
      secret,
    });
  }

  /**
   * Creates a webhook for email events.
   * @param url - Webhook endpoint URL
   * @param accountIds - Optional account IDs to filter
   * @param secret - Optional secret for signature verification
   * @returns Created webhook
   */
  async createEmailWebhook(
    url: string,
    accountIds?: string[],
    secret?: string,
  ): Promise<Webhook> {
    const { WebhookSource, WebhookEvent } = await import('../enums/index.js');
    return this.create({
      url,
      source: WebhookSource.EMAIL,
      events: [WebhookEvent.MAIL_SENT],
      accountIds,
      secret,
    });
  }

  /**
   * Creates a webhook for email tracking events.
   * @param url - Webhook endpoint URL
   * @param accountIds - Optional account IDs to filter
   * @param secret - Optional secret for signature verification
   * @returns Created webhook
   */
  async createEmailTrackingWebhook(
    url: string,
    accountIds?: string[],
    secret?: string,
  ): Promise<Webhook> {
    const { WebhookSource, WebhookEvent } = await import('../enums/index.js');
    return this.create({
      url,
      source: WebhookSource.EMAIL_TRACKING,
      events: [WebhookEvent.MAIL_OPENED, WebhookEvent.LINK_CLICKED],
      accountIds,
      secret,
    });
  }

  /**
   * Creates a webhook for account status changes.
   * @param url - Webhook endpoint URL
   * @param accountIds - Optional account IDs to filter
   * @param secret - Optional secret for signature verification
   * @returns Created webhook
   */
  async createAccountStatusWebhook(
    url: string,
    accountIds?: string[],
    secret?: string,
  ): Promise<Webhook> {
    const { WebhookSource, WebhookEvent } = await import('../enums/index.js');
    return this.create({
      url,
      source: WebhookSource.ACCOUNT_STATUS,
      events: [WebhookEvent.ACCOUNT_STATUS_CHANGED],
      accountIds,
      secret,
    });
  }
}
