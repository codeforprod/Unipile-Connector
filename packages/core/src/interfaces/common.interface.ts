/**
 * Paginated list response from Unipile API.
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];

  /** Cursor for next page, null if no more pages */
  cursor: string | null;

  /** Total count of items (if available) */
  total?: number;
}

/**
 * Pagination options for list requests.
 */
export interface PaginationOptions {
  /** Number of items per page */
  limit?: number;

  /** Cursor for pagination */
  cursor?: string;

  /** Starting offset */
  offset?: number;
}

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;

  /** Response status */
  success: boolean;
}

/**
 * Attachment metadata.
 */
export interface Attachment {
  /** Unique attachment identifier */
  id: string;

  /** Original filename */
  filename: string;

  /** MIME content type */
  contentType: string;

  /** File size in bytes */
  size: number;

  /** Download URL (if available) */
  url?: string;

  /** Base64 encoded content (for uploads) */
  content?: string;
}

/**
 * Date range filter.
 */
export interface DateRange {
  /** Start date (ISO 8601 format) */
  from?: string;

  /** End date (ISO 8601 format) */
  to?: string;
}
