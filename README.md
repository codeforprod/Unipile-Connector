# Unipile Connector

A universal NPM package for Unipile integration providing email operations, social network messaging capabilities, and LinkedIn Sales Navigator features.

## Packages

| Package | Description | NPM |
|---------|-------------|-----|
| [@unipile/core](./packages/core) | Framework-agnostic Unipile API client | [![npm](https://img.shields.io/npm/v/@unipile/core)](https://www.npmjs.com/package/@unipile/core) |
| [@unipile/nestjs](./packages/nestjs) | NestJS dynamic module integration | [![npm](https://img.shields.io/npm/v/@unipile/nestjs)](https://www.npmjs.com/package/@unipile/nestjs) |

## Features

### Email Operations
- Send emails with HTML/plain text body, attachments, CC/BCC
- Reply threading via `replyTo` parameter
- Email tracking (opens, link clicks)
- List, retrieve, update, delete emails
- Folder management

### Messaging Operations
- Start new chats on all 7 platforms (LinkedIn, WhatsApp, Instagram, Messenger, Telegram, Twitter/X, Slack)
- Send messages with attachment support
- LinkedIn InMail, Sales Navigator, Recruiter API
- Get chat history with pagination
- List attendees/contacts

### LinkedIn Sales Navigator
- Company search with 15+ filters (industry, location, headcount, revenue, etc.)
- Employee/People search with role, location, company filters
- Company profile enrichment
- Person profile enrichment
- Search parameter enumeration for dynamic dropdowns

### Account Management
- Connect accounts (OAuth, credentials, cookies, QR codes)
- Handle 2FA/checkpoints (OTP, in-app validation, CAPTCHA)
- Reconnect disconnected accounts
- Monitor account status (OK, CONNECTING, CREDENTIALS, PERMISSIONS, ERROR, STOPPED)
- Create hosted auth links

### Webhook Integration
- Create/delete webhooks for sources: messaging, email, email_tracking, account_status
- Events: message_received, mail_sent, mail_opened, link_clicked, account_status_changed
- Custom headers and signature verification

## Quick Start

### Installation

```bash
# Core package (framework-agnostic)
pnpm add @unipile/core

# NestJS integration
pnpm add @unipile/nestjs
```

### Basic Usage

```typescript
import { UnipileClient } from '@unipile/core';

const client = new UnipileClient({
  dsn: 'api6.unipile.com:13624',
  apiKey: 'your-api-key',
});

// List accounts
const accounts = await client.accounts.list();

// Send an email
await client.email.send({
  accountId: 'account-123',
  to: [{ email: 'recipient@example.com', name: 'Recipient' }],
  subject: 'Hello from Unipile',
  bodyHtml: '<h1>Hello!</h1><p>This is a test email.</p>',
  tracking: true,
});

// Start a chat
const chat = await client.messaging.startChat({
  accountId: 'linkedin-account-123',
  attendeeIds: ['user-456'],
  message: 'Hi there!',
});

// Search LinkedIn companies
const companies = await client.linkedin.searchCompanies({
  accountId: 'linkedin-account-123',
  filters: {
    industries: ['Technology'],
    locations: ['San Francisco'],
    employeeCountRange: { min: 50, max: 500 },
  },
});
```

### NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { UnipileModule } from '@unipile/nestjs';

@Module({
  imports: [
    UnipileModule.forRoot({
      dsn: process.env.UNIPILE_DSN,
      apiKey: process.env.UNIPILE_API_KEY,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

Or with async configuration:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnipileModule } from '@unipile/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UnipileModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dsn: config.get('UNIPILE_DSN'),
        apiKey: config.get('UNIPILE_API_KEY'),
      }),
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

Inject services in your code:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectEmailService, InjectLinkedInService, EmailService, LinkedInService } from '@unipile/nestjs';

@Injectable()
export class MyService {
  constructor(
    @InjectEmailService() private readonly email: EmailService,
    @InjectLinkedInService() private readonly linkedin: LinkedInService,
  ) {}

  async sendWelcomeEmail(to: string): Promise<void> {
    await this.email.send({
      accountId: 'account-123',
      to: [{ email: to }],
      subject: 'Welcome!',
      body: 'Welcome to our service!',
    });
  }
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UNIPILE_DSN` | API domain:port (e.g., `api6.unipile.com:13624`) | Yes |
| `UNIPILE_API_KEY` | API access token | Yes |
| `UNIPILE_USE_HTTP` | Use HTTP instead of HTTPS (default: `false`) | No |

## Error Handling

The client provides categorized errors for proper handling:

```typescript
import {
  UnipileError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  AuthError,
  ValidationError,
  NotFoundError,
} from '@unipile/core';

try {
  await client.email.send(request);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    const retryAfter = error.getRetryAfterMs();
    console.log(`Rate limited. Retry after ${retryAfter}ms`);
  } else if (error instanceof AuthError) {
    // Re-authenticate
    console.log('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    // Fix request
    console.log('Validation errors:', error.errors);
  }
}
```

## Rate Limiting

The client includes automatic rate limiting with exponential backoff:

- Per-account rate limit tracking
- Automatic retry with configurable delays
- Respects `Retry-After` and `X-RateLimit-Reset` headers
- Base delay: 5 minutes, max delay: 2 hours

Configure retry behavior:

```typescript
const client = new UnipileClient({
  dsn: 'api6.unipile.com:13624',
  apiKey: 'your-api-key',
  enableRetry: true,
  retryBaseDelay: 300000,  // 5 minutes
  retryMaxDelay: 7200000,  // 2 hours
  maxRetries: 5,
});
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Project Structure

```
unipile-connector/
├── packages/
│   ├── core/           # Framework-agnostic client
│   │   ├── src/
│   │   │   ├── client/     # Main client class
│   │   │   ├── enums/      # Type enumerations
│   │   │   ├── errors/     # Error classes
│   │   │   ├── http/       # HTTP client & rate limiter
│   │   │   ├── interfaces/ # TypeScript interfaces
│   │   │   └── services/   # API service implementations
│   │   └── package.json
│   └── nestjs/         # NestJS integration
│       ├── src/
│       │   ├── decorators/ # Injection decorators
│       │   ├── interfaces/ # Module options
│       │   └── unipile.module.ts
│       └── package.json
├── turbo.json          # Turborepo configuration
├── pnpm-workspace.yaml # pnpm workspace configuration
└── package.json        # Root package.json
```

## License

MIT
