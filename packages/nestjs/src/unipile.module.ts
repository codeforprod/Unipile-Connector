import { DynamicModule, Module, Provider, Type, InjectionToken } from '@nestjs/common';
import {
  UnipileClient,
  AccountService,
  EmailService,
  MessagingService,
  LinkedInService,
  WebhookService,
} from '@unipile/core';
import type {
  UnipileModuleOptions,
  UnipileModuleAsyncOptions,
  UnipileOptionsFactory,
} from './interfaces/module-options.interface.js';
import {
  UNIPILE_MODULE_OPTIONS,
  UNIPILE_CLIENT,
  UNIPILE_ACCOUNT_SERVICE,
  UNIPILE_EMAIL_SERVICE,
  UNIPILE_MESSAGING_SERVICE,
  UNIPILE_LINKEDIN_SERVICE,
  UNIPILE_WEBHOOK_SERVICE,
} from './constants.js';

/**
 * NestJS module for Unipile API integration.
 *
 * @example
 * Synchronous configuration:
 * ```typescript
 * @Module({
 *   imports: [
 *     UnipileModule.forRoot({
 *       dsn: 'api6.unipile.com:13624',
 *       apiKey: 'your-api-key',
 *       isGlobal: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * Asynchronous configuration with factory:
 * ```typescript
 * @Module({
 *   imports: [
 *     UnipileModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (config: ConfigService) => ({
 *         dsn: config.get('UNIPILE_DSN'),
 *         apiKey: config.get('UNIPILE_API_KEY'),
 *       }),
 *       isGlobal: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * Asynchronous configuration with class:
 * ```typescript
 * @Injectable()
 * class UnipileConfigService implements UnipileOptionsFactory {
 *   constructor(private readonly config: ConfigService) {}
 *
 *   createUnipileOptions(): UnipileModuleOptions {
 *     return {
 *       dsn: this.config.get('UNIPILE_DSN'),
 *       apiKey: this.config.get('UNIPILE_API_KEY'),
 *     };
 *   }
 * }
 *
 * @Module({
 *   imports: [
 *     UnipileModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useClass: UnipileConfigService,
 *       isGlobal: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class UnipileModule {
  /**
   * Registers the module with synchronous configuration.
   * @param options - Module configuration options
   * @returns Dynamic module
   */
  static forRoot(options: UnipileModuleOptions): DynamicModule {
    const providers = this.createProviders(options);

    return {
      module: UnipileModule,
      global: options.isGlobal ?? false,
      providers,
      exports: [
        UNIPILE_CLIENT,
        UNIPILE_ACCOUNT_SERVICE,
        UNIPILE_EMAIL_SERVICE,
        UNIPILE_MESSAGING_SERVICE,
        UNIPILE_LINKEDIN_SERVICE,
        UNIPILE_WEBHOOK_SERVICE,
      ],
    };
  }

  /**
   * Registers the module with asynchronous configuration.
   * @param options - Async module configuration options
   * @returns Dynamic module
   */
  static forRootAsync(options: UnipileModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    const serviceProviders = this.createServiceProviders();

    return {
      module: UnipileModule,
      global: options.isGlobal ?? false,
      imports: options.imports ?? [],
      providers: [...asyncProviders, ...serviceProviders],
      exports: [
        UNIPILE_CLIENT,
        UNIPILE_ACCOUNT_SERVICE,
        UNIPILE_EMAIL_SERVICE,
        UNIPILE_MESSAGING_SERVICE,
        UNIPILE_LINKEDIN_SERVICE,
        UNIPILE_WEBHOOK_SERVICE,
      ],
    };
  }

  /**
   * Creates providers for synchronous configuration.
   */
  private static createProviders(options: UnipileModuleOptions): Provider[] {
    const client = new UnipileClient(options);

    return [
      {
        provide: UNIPILE_MODULE_OPTIONS,
        useValue: options,
      },
      {
        provide: UNIPILE_CLIENT,
        useValue: client,
      },
      {
        provide: UNIPILE_ACCOUNT_SERVICE,
        useValue: client.accounts,
      },
      {
        provide: UNIPILE_EMAIL_SERVICE,
        useValue: client.email,
      },
      {
        provide: UNIPILE_MESSAGING_SERVICE,
        useValue: client.messaging,
      },
      {
        provide: UNIPILE_LINKEDIN_SERVICE,
        useValue: client.linkedin,
      },
      {
        provide: UNIPILE_WEBHOOK_SERVICE,
        useValue: client.webhooks,
      },
    ];
  }

  /**
   * Creates providers for asynchronous configuration.
   */
  private static createAsyncProviders(options: UnipileModuleAsyncOptions): Provider[] {
    if (options.useExisting !== undefined || options.useFactory !== undefined) {
      return [this.createAsyncOptionsProvider(options)];
    }

    if (options.useClass !== undefined) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    throw new Error(
      'Invalid configuration. Must provide useFactory, useClass, or useExisting.',
    );
  }

  /**
   * Creates the async options provider.
   */
  private static createAsyncOptionsProvider(options: UnipileModuleAsyncOptions): Provider {
    if (options.useFactory !== undefined) {
      return {
        provide: UNIPILE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: (options.inject ?? []) as InjectionToken[],
      };
    }

    const inject = options.useExisting ?? options.useClass;

    if (inject === undefined) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass, or useExisting.');
    }

    return {
      provide: UNIPILE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: UnipileOptionsFactory): Promise<UnipileModuleOptions> =>
        optionsFactory.createUnipileOptions(),
      inject: [inject] as Type<UnipileOptionsFactory>[],
    };
  }

  /**
   * Creates service providers that depend on the client.
   */
  private static createServiceProviders(): Provider[] {
    return [
      {
        provide: UNIPILE_CLIENT,
        useFactory: (options: UnipileModuleOptions): UnipileClient => new UnipileClient(options),
        inject: [UNIPILE_MODULE_OPTIONS],
      },
      {
        provide: UNIPILE_ACCOUNT_SERVICE,
        useFactory: (client: UnipileClient): AccountService => client.accounts,
        inject: [UNIPILE_CLIENT],
      },
      {
        provide: UNIPILE_EMAIL_SERVICE,
        useFactory: (client: UnipileClient): EmailService => client.email,
        inject: [UNIPILE_CLIENT],
      },
      {
        provide: UNIPILE_MESSAGING_SERVICE,
        useFactory: (client: UnipileClient): MessagingService => client.messaging,
        inject: [UNIPILE_CLIENT],
      },
      {
        provide: UNIPILE_LINKEDIN_SERVICE,
        useFactory: (client: UnipileClient): LinkedInService => client.linkedin,
        inject: [UNIPILE_CLIENT],
      },
      {
        provide: UNIPILE_WEBHOOK_SERVICE,
        useFactory: (client: UnipileClient): WebhookService => client.webhooks,
        inject: [UNIPILE_CLIENT],
      },
    ];
  }
}
