# @prodforcode/unipile-core

Framework-agnostic Unipile API client for email, messaging, and LinkedIn Sales Navigator operations.

## Installation

```bash
npm install @prodforcode/unipile-core
# or
pnpm add @prodforcode/unipile-core
# or
yarn add @prodforcode/unipile-core
```

## Quick Start

```typescript
import { UnipileClient } from '@prodforcode/unipile-core';

// Create client
const client = new UnipileClient({
  dsn: 'api6.unipile.com:13624',
  apiKey: 'your-api-key',
});

// Or create from environment variables
const client = UnipileClient.fromEnv();
```

## Services

### Account Service

```typescript
// List accounts
const accounts = await client.accounts.list({ limit: 10 });

// Get account by ID
const account = await client.accounts.get('account-123');

// Connect with OAuth
const oauthResult = await client.accounts.connectOAuth({
  provider: AccountProvider.GMAIL,
  code: 'oauth-code',
  redirectUri: 'https://yourapp.com/callback',
});

// Connect with credentials
const credResult = await client.accounts.connectCredentials({
  provider: AccountProvider.LINKEDIN,
  username: 'user@example.com',
  password: 'password',
});

// Handle checkpoint (2FA)
if (client.accounts.isCheckpoint(credResult)) {
  const resolvedAccount = await client.accounts.resolveCheckpoint({
    accountId: credResult.accountId,
    type: CheckpointType.OTP,
    code: '123456',
  });
}

// Create hosted auth link
const link = await client.accounts.createHostedAuthLink({
  provider: AccountProvider.GMAIL,
  callbackUrl: 'https://yourapp.com/auth/callback',
});
```

### Email Service

```typescript
// List emails
const emails = await client.email.list({
  accountId: 'account-123',
  folder: 'inbox',
  isRead: false,
  limit: 50,
});

// Send email
const email = await client.email.send({
  accountId: 'account-123',
  to: [{ email: 'recipient@example.com', name: 'Recipient' }],
  subject: 'Hello',
  bodyHtml: '<h1>Hello!</h1>',
  tracking: true, // Enable open/click tracking
});

// Reply to email (threaded)
await client.email.reply('original-email-id', {
  accountId: 'account-123',
  to: [{ email: 'recipient@example.com' }],
  subject: 'Re: Hello',
  body: 'Thanks for your message!',
});

// Update email (mark read, star, move)
await client.email.markAsRead('email-123', 'account-123');
await client.email.star('email-123', 'account-123');
await client.email.moveToFolder('email-123', 'account-123', 'archive');

// List folders
const folders = await client.email.listFolders('account-123');
```

### Messaging Service

```typescript
// List chats
const chats = await client.messaging.listChats({
  accountId: 'account-123',
  hasUnread: true,
  limit: 20,
});

// Start a new chat
const chat = await client.messaging.startChat({
  accountId: 'linkedin-account-123',
  attendeeIds: ['user-456', 'user-789'],
  message: 'Hi everyone!',
});

// Send message
const message = await client.messaging.sendMessage({
  chatId: 'chat-123',
  text: 'Hello!',
});

// Send message with attachment
await client.messaging.sendMessage({
  chatId: 'chat-123',
  text: 'Check out this file',
  attachments: [{
    filename: 'document.pdf',
    contentType: 'application/pdf',
    content: 'base64-encoded-content',
  }],
});

// List messages with pagination
const messages = await client.messaging.listMessages({
  chatId: 'chat-123',
  limit: 50,
});

// LinkedIn InMail
await client.messaging.sendInMail({
  accountId: 'linkedin-account-123',
  recipientUrn: 'urn:li:person:12345',
  subject: 'Opportunity',
  body: 'I would like to discuss an opportunity...',
});

// Check InMail credits
const credits = await client.messaging.getInMailCredits('linkedin-account-123');
console.log(`Available: ${credits.available}/${credits.total}`);
```

### LinkedIn Service (Sales Navigator)

```typescript
// Search companies
const companies = await client.linkedin.searchCompanies({
  accountId: 'linkedin-account-123',
  filters: {
    keywords: 'artificial intelligence',
    industries: ['Technology', 'Software'],
    locations: ['San Francisco', 'New York'],
    employeeCountRange: { min: 50, max: 500 },
    revenueRange: { min: 1000000 },
    isHiring: true,
  },
  limit: 25,
});

// Search people
const people = await client.linkedin.searchPeople({
  accountId: 'linkedin-account-123',
  filters: {
    titles: ['CEO', 'CTO', 'VP Engineering'],
    seniorityLevels: ['VP', 'Director', 'CXO'],
    industries: ['Technology'],
    yearsOfExperience: { min: 10 },
    changedJobsRecently: true,
  },
  limit: 25,
});

// Enrich company profile
const company = await client.linkedin.enrichCompany({
  accountId: 'linkedin-account-123',
  companyIdentifier: 'urn:li:company:12345',
});

// Enrich person profile
const person = await client.linkedin.enrichPerson({
  accountId: 'linkedin-account-123',
  personIdentifier: 'urn:li:person:12345',
});

// Get search parameters for dropdowns
const industries = await client.linkedin.getIndustries('account-123', 'tech');
const locations = await client.linkedin.getLocations('account-123', 'san');
const seniorityLevels = await client.linkedin.getSeniorityLevels('account-123');

// Send connection request
await client.linkedin.sendConnectionRequest(
  'linkedin-account-123',
  'urn:li:person:12345',
  'Hi! I would like to connect.',
);
```

### Webhook Service

```typescript
// Create webhook
const webhook = await client.webhooks.create({
  url: 'https://yourapp.com/webhooks/unipile',
  source: WebhookSource.MESSAGING,
  events: [WebhookEvent.MESSAGE_RECEIVED],
  secret: 'your-webhook-secret',
  accountIds: ['account-123'], // Optional: filter by accounts
});

// Convenience methods
await client.webhooks.createMessagingWebhook('https://yourapp.com/messaging');
await client.webhooks.createEmailWebhook('https://yourapp.com/email');
await client.webhooks.createEmailTrackingWebhook('https://yourapp.com/tracking');
await client.webhooks.createAccountStatusWebhook('https://yourapp.com/status');

// List webhooks
const webhooks = await client.webhooks.list();

// Delete webhook
await client.webhooks.delete('webhook-123');

// Parse webhook payload in your endpoint
const payload = client.webhooks.parsePayload<MessageReceivedPayload>(requestBody);
```

## Error Handling

```typescript
import {
  UnipileError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  AuthError,
  ValidationError,
  NotFoundError,
  ErrorCategory,
} from '@prodforcode/unipile-core';

try {
  await client.email.send(request);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.getRetryAfterMs()}ms`);
    console.log(`Account: ${error.accountId}`);
  } else if (error instanceof AuthError) {
    console.log('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:');
    error.errors.forEach(e => console.log(`  ${e.field}: ${e.message}`));
  } else if (error instanceof NotFoundError) {
    console.log(`${error.resourceType} ${error.resourceId} not found`);
  } else if (error instanceof UnipileError) {
    console.log(`Error category: ${error.category}`);
    console.log(`Retryable: ${error.isRetryable}`);
    console.log(`Context:`, error.context);
  }
}
```

## Configuration Options

```typescript
interface UnipileConfig {
  /** API domain:port (e.g., "api6.unipile.com:13624") */
  dsn: string;

  /** API access token */
  apiKey: string;

  /** Use HTTP instead of HTTPS (default: false) */
  useHttp?: boolean;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable automatic retry with exponential backoff (default: true) */
  enableRetry?: boolean;

  /** Base delay for exponential backoff in ms (default: 300000 = 5 min) */
  retryBaseDelay?: number;

  /** Maximum delay for exponential backoff in ms (default: 7200000 = 2 hours) */
  retryMaxDelay?: number;

  /** Maximum number of retry attempts (default: 5) */
  maxRetries?: number;
}
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions. All interfaces are exported:

```typescript
import type {
  Account,
  Email,
  Chat,
  Message,
  LinkedInCompany,
  LinkedInPerson,
  Webhook,
  // ... and more
} from '@prodforcode/unipile-core';
```

## License

MIT
