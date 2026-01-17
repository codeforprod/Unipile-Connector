// Main client export
export { UnipileClient } from './client/index.js';

// Enums
export {
  AccountStatus,
  AccountProvider,
  WebhookSource,
  WebhookEvent,
  CheckpointType,
  ErrorCategory,
  LinkedInSearchType,
} from './enums/index.js';

// Interfaces
export type {
  UnipileConfig,
  PaginatedResponse,
  PaginationOptions,
  ApiResponse,
  Attachment,
  DateRange,
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
  EmailAddress,
  Email,
  EmailTracking,
  LinkClick,
  SendEmailRequest,
  UpdateEmailRequest,
  EmailFolder,
  ListEmailsOptions,
  CreateDraftRequest,
  ChatAttendee,
  Chat,
  Message,
  MessageDeliveryStatus,
  MessageReaction,
  StartChatRequest,
  SendMessageRequest,
  ListChatsOptions,
  ListMessagesOptions,
  SendInMailRequest,
  InMailCreditBalance,
  LinkedInCompany,
  LinkedInPerson,
  LinkedInPosition,
  LinkedInEducation,
  LinkedInLocation,
  CompanySearchFilters,
  PeopleSearchFilters,
  CompanySearchRequest,
  PeopleSearchRequest,
  CompanySearchResult,
  PeopleSearchResult,
  SearchParameterValue,
  SearchParameterType,
  GetSearchParametersRequest,
  EnrichCompanyRequest,
  EnrichPersonRequest,
  Webhook,
  CreateWebhookRequest,
  MessageReceivedPayload,
  MailSentPayload,
  MailOpenedPayload,
  LinkClickedPayload,
  AccountStatusChangedPayload,
  WebhookPayload,
  WebhookDelivery,
} from './interfaces/index.js';

export { DEFAULT_CONFIG } from './interfaces/index.js';

// Services (for advanced usage)
export {
  AccountService,
  EmailService,
  MessagingService,
  LinkedInService,
  WebhookService,
} from './services/index.js';

// HTTP client (for advanced usage)
export { HttpClient, type RequestOptions, type HttpResponse } from './http/index.js';
export { RateLimiter } from './http/index.js';

// Errors
export {
  UnipileError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  AuthError,
  ValidationError,
  NotFoundError,
  type ErrorContext,
  type ValidationErrorDetail,
} from './errors/index.js';
