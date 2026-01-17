export type {
  UnipileConfig,
} from './config.interface.js';

export { DEFAULT_CONFIG } from './config.interface.js';

export type {
  PaginatedResponse,
  PaginationOptions,
  ApiResponse,
  Attachment,
  DateRange,
} from './common.interface.js';

export type {
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
} from './account.interface.js';

export type {
  EmailAddress,
  Email,
  EmailTracking,
  LinkClick,
  SendEmailRequest,
  UpdateEmailRequest,
  EmailFolder,
  ListEmailsOptions,
  CreateDraftRequest,
} from './email.interface.js';

export type {
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
} from './messaging.interface.js';

export type {
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
} from './linkedin.interface.js';

export type {
  Webhook,
  CreateWebhookRequest,
  MessageReceivedPayload,
  MailSentPayload,
  MailOpenedPayload,
  LinkClickedPayload,
  AccountStatusChangedPayload,
  WebhookPayload,
  WebhookDelivery,
} from './webhook.interface.js';
