import type { HttpClient } from '../http/http-client.js';
import type {
  Email,
  SendEmailRequest,
  UpdateEmailRequest,
  EmailFolder,
  ListEmailsOptions,
  CreateDraftRequest,
  PaginatedResponse,
} from '../interfaces/index.js';

/**
 * API response shape for email list.
 */
interface EmailListResponse {
  items?: Email[];
  emails?: Email[];
  cursor?: string;
  next_cursor?: string;
  total?: number;
}

/**
 * API response shape for folder list.
 */
interface FolderListResponse {
  items?: EmailFolder[];
  folders?: EmailFolder[];
}

/**
 * Service for email operations.
 * Handles sending, receiving, tracking, and managing emails.
 */
export class EmailService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Lists emails for an account with optional filtering.
   * @param options - List options including filters and pagination
   * @returns Paginated list of emails
   */
  async list(options: ListEmailsOptions): Promise<PaginatedResponse<Email>> {
    const response = await this.httpClient.get<EmailListResponse>(
      `/api/v1/emails`,
      {
        account_id: options.accountId,
        folder: options.folder,
        is_read: options.isRead,
        is_starred: options.isStarred,
        query: options.query,
        date_from: options.dateFrom,
        date_to: options.dateTo,
        limit: options.limit,
        cursor: options.cursor,
      },
      options.accountId,
    );

    return {
      items: response.data.items ?? response.data.emails ?? [],
      cursor: response.data.cursor ?? response.data.next_cursor ?? null,
      total: response.data.total,
    };
  }

  /**
   * Gets a specific email by ID.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @returns Email details
   */
  async get(emailId: string, accountId: string): Promise<Email> {
    const response = await this.httpClient.get<Email>(
      `/api/v1/emails/${emailId}`,
      { account_id: accountId },
      accountId,
    );
    return response.data;
  }

  /**
   * Sends a new email.
   * @param request - Send email parameters
   * @returns Sent email details
   */
  async send(request: SendEmailRequest): Promise<Email> {
    const response = await this.httpClient.post<Email>(
      '/api/v1/emails',
      {
        account_id: request.accountId,
        to: request.to.map((addr) => ({
          email: addr.email,
          name: addr.name,
        })),
        subject: request.subject,
        body: request.body,
        body_html: request.bodyHtml,
        cc: request.cc?.map((addr) => ({
          email: addr.email,
          name: addr.name,
        })),
        bcc: request.bcc?.map((addr) => ({
          email: addr.email,
          name: addr.name,
        })),
        attachments: request.attachments?.map((att) => ({
          filename: att.filename,
          content_type: att.contentType,
          content: att.content,
        })),
        reply_to: request.replyTo,
        tracking: request.tracking,
        scheduled_at: request.scheduledAt,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Updates an email (mark read/unread, star, move to folder).
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @param request - Update parameters
   * @returns Updated email
   */
  async update(emailId: string, accountId: string, request: UpdateEmailRequest): Promise<Email> {
    const response = await this.httpClient.patch<Email>(
      `/api/v1/emails/${emailId}`,
      {
        account_id: accountId,
        is_read: request.isRead,
        is_starred: request.isStarred,
        folder: request.folder,
      },
      accountId,
    );
    return response.data;
  }

  /**
   * Deletes an email.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   */
  async delete(emailId: string, accountId: string): Promise<void> {
    await this.httpClient.delete(`/api/v1/emails/${emailId}?account_id=${accountId}`, accountId);
  }

  /**
   * Lists email folders for an account.
   * @param accountId - Account identifier
   * @returns List of email folders
   */
  async listFolders(accountId: string): Promise<EmailFolder[]> {
    const response = await this.httpClient.get<FolderListResponse>(
      '/api/v1/emails/folders',
      { account_id: accountId },
      accountId,
    );
    return response.data.items ?? response.data.folders ?? [];
  }

  /**
   * Creates a draft email.
   * @param request - Draft creation parameters
   * @returns Created draft
   */
  async createDraft(request: CreateDraftRequest): Promise<Email> {
    const response = await this.httpClient.post<Email>(
      '/api/v1/emails/drafts',
      {
        account_id: request.accountId,
        to: request.to?.map((addr) => ({
          email: addr.email,
          name: addr.name,
        })),
        subject: request.subject,
        body: request.body,
        body_html: request.bodyHtml,
        cc: request.cc?.map((addr) => ({
          email: addr.email,
          name: addr.name,
        })),
        bcc: request.bcc?.map((addr) => ({
          email: addr.email,
          name: addr.name,
        })),
        attachments: request.attachments?.map((att) => ({
          filename: att.filename,
          content_type: att.contentType,
          content: att.content,
        })),
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Marks an email as read.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @returns Updated email
   */
  async markAsRead(emailId: string, accountId: string): Promise<Email> {
    return this.update(emailId, accountId, { isRead: true });
  }

  /**
   * Marks an email as unread.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @returns Updated email
   */
  async markAsUnread(emailId: string, accountId: string): Promise<Email> {
    return this.update(emailId, accountId, { isRead: false });
  }

  /**
   * Stars an email.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @returns Updated email
   */
  async star(emailId: string, accountId: string): Promise<Email> {
    return this.update(emailId, accountId, { isStarred: true });
  }

  /**
   * Unstars an email.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @returns Updated email
   */
  async unstar(emailId: string, accountId: string): Promise<Email> {
    return this.update(emailId, accountId, { isStarred: false });
  }

  /**
   * Moves an email to a different folder.
   * @param emailId - Email identifier
   * @param accountId - Account identifier
   * @param folder - Target folder name
   * @returns Updated email
   */
  async moveToFolder(emailId: string, accountId: string, folder: string): Promise<Email> {
    return this.update(emailId, accountId, { folder });
  }

  /**
   * Sends a reply to an email (threaded).
   * @param originalEmailId - ID of the email to reply to
   * @param request - Reply email parameters
   * @returns Sent reply
   */
  async reply(originalEmailId: string, request: Omit<SendEmailRequest, 'replyTo'>): Promise<Email> {
    return this.send({
      ...request,
      replyTo: originalEmailId,
    });
  }
}
