import { Inject } from '@nestjs/common';
import {
  UNIPILE_CLIENT,
  UNIPILE_ACCOUNT_SERVICE,
  UNIPILE_EMAIL_SERVICE,
  UNIPILE_MESSAGING_SERVICE,
  UNIPILE_LINKEDIN_SERVICE,
  UNIPILE_WEBHOOK_SERVICE,
} from '../constants.js';

/**
 * Decorator to inject the Unipile client.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectUnipileClient() private readonly client: UnipileClient) {}
 * }
 * ```
 */
export const InjectUnipileClient = (): ParameterDecorator => Inject(UNIPILE_CLIENT);

/**
 * Decorator to inject the Account service.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectAccountService() private readonly accounts: AccountService) {}
 * }
 * ```
 */
export const InjectAccountService = (): ParameterDecorator => Inject(UNIPILE_ACCOUNT_SERVICE);

/**
 * Decorator to inject the Email service.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectEmailService() private readonly email: EmailService) {}
 * }
 * ```
 */
export const InjectEmailService = (): ParameterDecorator => Inject(UNIPILE_EMAIL_SERVICE);

/**
 * Decorator to inject the Messaging service.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectMessagingService() private readonly messaging: MessagingService) {}
 * }
 * ```
 */
export const InjectMessagingService = (): ParameterDecorator => Inject(UNIPILE_MESSAGING_SERVICE);

/**
 * Decorator to inject the LinkedIn service.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectLinkedInService() private readonly linkedin: LinkedInService) {}
 * }
 * ```
 */
export const InjectLinkedInService = (): ParameterDecorator => Inject(UNIPILE_LINKEDIN_SERVICE);

/**
 * Decorator to inject the Webhook service.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectWebhookService() private readonly webhooks: WebhookService) {}
 * }
 * ```
 */
export const InjectWebhookService = (): ParameterDecorator => Inject(UNIPILE_WEBHOOK_SERVICE);
