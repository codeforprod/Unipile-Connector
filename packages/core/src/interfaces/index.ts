export type { UnipileConfig, UnipileApiVersion } from './config.interface.js';

export { DEFAULT_CONFIG, DEFAULT_V2_API_BASE_URL } from './config.interface.js';

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
  AuthIntentType,
  CreateAuthIntentRequest,
  AuthIntent,
  CreateAuthLinkRequest,
  AuthLink,
  ResolveAuthCheckpointRequest,
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
  EmailCompatibilityBoundary,
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
  JsonAttachment,
  UpdateChatRequest,
  DownloadAttachmentRequest,
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
  LinkedInSearchParameterV2Type,
  GetSearchParametersRequest,
  EnrichCompanyRequest,
  EnrichPersonRequest,
  LinkedInRouteGroup,
  RawLinkedInRequest,
  GetLinkedInSearchParametersV2Request,
  LinkedInSearchV2Request,
  ListPostsRequest,
  ReactToPostRequest,
  CreatePostCommentRequest,
  SendInvitationRequest,
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
  WebhookEndpoint,
  CreateWebhookEndpointRequest,
  WebhookEventType,
} from './webhook.interface.js';
