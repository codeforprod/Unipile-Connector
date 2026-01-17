# @unipile/nestjs

NestJS dynamic module for Unipile API integration with dependency injection support.

## Installation

```bash
npm install @unipile/nestjs @unipile/core
# or
pnpm add @unipile/nestjs @unipile/core
# or
yarn add @unipile/nestjs @unipile/core
```

## Quick Start

### Basic Configuration

```typescript
import { Module } from '@nestjs/common';
import { UnipileModule } from '@unipile/nestjs';

@Module({
  imports: [
    UnipileModule.forRoot({
      dsn: 'api6.unipile.com:13624',
      apiKey: 'your-api-key',
      isGlobal: true, // Make available everywhere
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

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
        enableRetry: true,
        timeout: 60000,
      }),
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### Using a Configuration Class

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnipileOptionsFactory, UnipileModuleOptions } from '@unipile/nestjs';

@Injectable()
class UnipileConfigService implements UnipileOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createUnipileOptions(): UnipileModuleOptions {
    return {
      dsn: this.config.get('UNIPILE_DSN'),
      apiKey: this.config.get('UNIPILE_API_KEY'),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    UnipileModule.forRootAsync({
      imports: [ConfigModule],
      useClass: UnipileConfigService,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

## Injection Decorators

Use the provided decorators to inject Unipile services:

```typescript
import { Injectable } from '@nestjs/common';
import {
  InjectUnipileClient,
  InjectAccountService,
  InjectEmailService,
  InjectMessagingService,
  InjectLinkedInService,
  InjectWebhookService,
  UnipileClient,
  AccountService,
  EmailService,
  MessagingService,
  LinkedInService,
  WebhookService,
} from '@unipile/nestjs';

@Injectable()
export class MyService {
  constructor(
    @InjectUnipileClient() private readonly client: UnipileClient,
    @InjectAccountService() private readonly accounts: AccountService,
    @InjectEmailService() private readonly email: EmailService,
    @InjectMessagingService() private readonly messaging: MessagingService,
    @InjectLinkedInService() private readonly linkedin: LinkedInService,
    @InjectWebhookService() private readonly webhooks: WebhookService,
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

## Available Injection Tokens

| Decorator | Token | Type |
|-----------|-------|------|
| `@InjectUnipileClient()` | `UNIPILE_CLIENT` | `UnipileClient` |
| `@InjectAccountService()` | `UNIPILE_ACCOUNT_SERVICE` | `AccountService` |
| `@InjectEmailService()` | `UNIPILE_EMAIL_SERVICE` | `EmailService` |
| `@InjectMessagingService()` | `UNIPILE_MESSAGING_SERVICE` | `MessagingService` |
| `@InjectLinkedInService()` | `UNIPILE_LINKEDIN_SERVICE` | `LinkedInService` |
| `@InjectWebhookService()` | `UNIPILE_WEBHOOK_SERVICE` | `WebhookService` |

## Example Controller

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  InjectEmailService,
  InjectAccountService,
  EmailService,
  AccountService,
  SendEmailRequest,
  Account,
  PaginatedResponse,
} from '@unipile/nestjs';

@Controller('unipile')
export class UnipileController {
  constructor(
    @InjectEmailService() private readonly email: EmailService,
    @InjectAccountService() private readonly accounts: AccountService,
  ) {}

  @Get('accounts')
  async listAccounts(): Promise<PaginatedResponse<Account>> {
    return this.accounts.list({ limit: 50 });
  }

  @Get('accounts/:id')
  async getAccount(@Param('id') id: string): Promise<Account> {
    return this.accounts.get(id);
  }

  @Post('emails')
  async sendEmail(@Body() request: SendEmailRequest): Promise<void> {
    await this.email.send(request);
  }
}
```

## Webhook Handler Example

```typescript
import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import {
  InjectWebhookService,
  WebhookService,
  MessageReceivedPayload,
  WebhookEvent,
} from '@unipile/nestjs';

@Controller('webhooks')
export class WebhookController {
  constructor(
    @InjectWebhookService() private readonly webhooks: WebhookService,
  ) {}

  @Post('unipile')
  async handleWebhook(
    @Body() body: string,
    @Headers('x-unipile-signature') signature: string,
  ): Promise<void> {
    // Verify signature
    const secret = process.env.WEBHOOK_SECRET;
    if (!this.webhooks.verifySignature(body, signature, secret)) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    // Parse and handle payload
    const payload = this.webhooks.parsePayload<MessageReceivedPayload>(body);

    if (payload.event === WebhookEvent.MESSAGE_RECEIVED) {
      console.log(`New message from ${payload.sender.name}: ${payload.text}`);
      // Handle message...
    }
  }
}
```

## Module Options

```typescript
interface UnipileModuleOptions {
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

  /** Base delay for exponential backoff in ms (default: 300000) */
  retryBaseDelay?: number;

  /** Maximum delay for exponential backoff in ms (default: 7200000) */
  retryMaxDelay?: number;

  /** Maximum number of retry attempts (default: 5) */
  maxRetries?: number;

  /** Register as global module (default: false) */
  isGlobal?: boolean;
}
```

## Re-exports

This package re-exports everything from `@unipile/core` for convenience:

```typescript
import {
  // Types
  Account,
  Email,
  Chat,
  Message,
  LinkedInCompany,
  LinkedInPerson,
  Webhook,

  // Enums
  AccountStatus,
  AccountProvider,
  WebhookSource,
  WebhookEvent,
  CheckpointType,
  ErrorCategory,

  // Errors
  UnipileError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  AuthError,
  ValidationError,
  NotFoundError,
} from '@unipile/nestjs';
```

## License

MIT
