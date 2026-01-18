import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UnipileModule } from './unipile.module.js';
import {
  UNIPILE_CLIENT,
  UNIPILE_ACCOUNT_SERVICE,
  UNIPILE_EMAIL_SERVICE,
  UNIPILE_MESSAGING_SERVICE,
  UNIPILE_LINKEDIN_SERVICE,
  UNIPILE_WEBHOOK_SERVICE,
} from './constants.js';

describe('UnipileModule', () => {
  describe('forRoot', () => {
    let module: TestingModule;

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [
          UnipileModule.forRoot({
            dsn: 'api.example.com:443',
            apiKey: 'test-api-key',
          }),
        ],
      }).compile();
    });

    afterAll(async () => {
      await module.close();
    });

    it('should provide UnipileClient', () => {
      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();
    });

    it('should provide AccountService', () => {
      const service = module.get(UNIPILE_ACCOUNT_SERVICE);
      expect(service).toBeDefined();
    });

    it('should provide EmailService', () => {
      const service = module.get(UNIPILE_EMAIL_SERVICE);
      expect(service).toBeDefined();
    });

    it('should provide MessagingService', () => {
      const service = module.get(UNIPILE_MESSAGING_SERVICE);
      expect(service).toBeDefined();
    });

    it('should provide LinkedInService', () => {
      const service = module.get(UNIPILE_LINKEDIN_SERVICE);
      expect(service).toBeDefined();
    });

    it('should provide WebhookService', () => {
      const service = module.get(UNIPILE_WEBHOOK_SERVICE);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync with useFactory', () => {
    let module: TestingModule;

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [
          UnipileModule.forRootAsync({
            useFactory: () => ({
              dsn: 'api.example.com:443',
              apiKey: 'test-api-key',
            }),
          }),
        ],
      }).compile();
    });

    afterAll(async () => {
      await module.close();
    });

    it('should provide UnipileClient', () => {
      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();
    });

    it('should provide all services', () => {
      expect(module.get(UNIPILE_ACCOUNT_SERVICE)).toBeDefined();
      expect(module.get(UNIPILE_EMAIL_SERVICE)).toBeDefined();
      expect(module.get(UNIPILE_MESSAGING_SERVICE)).toBeDefined();
      expect(module.get(UNIPILE_LINKEDIN_SERVICE)).toBeDefined();
      expect(module.get(UNIPILE_WEBHOOK_SERVICE)).toBeDefined();
    });
  });

  describe('forRootAsync with useFactory and inject', () => {
    const CONFIG_TOKEN = 'CONFIG_TOKEN';

    let module: TestingModule;

    beforeAll(async () => {
      // Create a test config module that exports the provider
      const ConfigModule = {
        module: class ConfigModule {},
        providers: [
          {
            provide: CONFIG_TOKEN,
            useValue: {
              dsn: 'api.example.com:443',
              apiKey: 'injected-api-key',
            },
          },
        ],
        exports: [CONFIG_TOKEN],
      };

      module = await Test.createTestingModule({
        imports: [
          ConfigModule,
          UnipileModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: { dsn: string; apiKey: string }) => ({
              dsn: config.dsn,
              apiKey: config.apiKey,
            }),
            inject: [CONFIG_TOKEN],
          }),
        ],
      }).compile();
    });

    afterAll(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should provide UnipileClient with injected config', () => {
      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();
    });
  });

  describe('forRoot with isGlobal', () => {
    it('should create global module when isGlobal is true', async () => {
      const module = await Test.createTestingModule({
        imports: [
          UnipileModule.forRoot({
            dsn: 'api.example.com:443',
            apiKey: 'test-api-key',
            isGlobal: true,
          }),
        ],
      }).compile();

      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();

      await module.close();
    });
  });

  describe('forRootAsync validation', () => {
    it('should throw error when no config method provided', () => {
      expect(() => {
        UnipileModule.forRootAsync({});
      }).toThrow('Invalid configuration. Must provide useFactory, useClass, or useExisting.');
    });
  });

  describe('forRootAsync with useClass', () => {
    let module: TestingModule;

    // Define class outside the test to be used as a type
    const UNIPILE_OPTIONS_FACTORY_TOKEN = 'UNIPILE_OPTIONS_FACTORY';

    beforeAll(async () => {
      // Create a mock options factory class
      class UnipileOptionsFactory {
        createUnipileOptions() {
          return {
            dsn: 'api.example.com:443',
            apiKey: 'class-api-key',
          };
        }
      }

      module = await Test.createTestingModule({
        imports: [
          UnipileModule.forRootAsync({
            useClass: UnipileOptionsFactory as any,
          }),
        ],
      }).compile();
    });

    afterAll(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should provide UnipileClient with useClass config', () => {
      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();
    });
  });

  describe('forRootAsync with useExisting', () => {
    let module: TestingModule;

    beforeAll(async () => {
      const EXISTING_FACTORY_TOKEN = 'EXISTING_FACTORY';

      // Create a mock existing factory
      const ExistingFactoryModule = {
        module: class ExistingFactoryModule {},
        providers: [
          {
            provide: EXISTING_FACTORY_TOKEN,
            useValue: {
              createUnipileOptions: () => ({
                dsn: 'api.example.com:443',
                apiKey: 'existing-api-key',
              }),
            },
          },
        ],
        exports: [EXISTING_FACTORY_TOKEN],
      };

      module = await Test.createTestingModule({
        imports: [
          ExistingFactoryModule,
          UnipileModule.forRootAsync({
            imports: [ExistingFactoryModule],
            useExisting: EXISTING_FACTORY_TOKEN as any,
          }),
        ],
      }).compile();
    });

    afterAll(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should provide UnipileClient with useExisting config', () => {
      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();
    });
  });

  describe('forRootAsync with isGlobal', () => {
    it('should create global module when isGlobal is true with async config', async () => {
      const module = await Test.createTestingModule({
        imports: [
          UnipileModule.forRootAsync({
            useFactory: () => ({
              dsn: 'api.example.com:443',
              apiKey: 'test-api-key',
            }),
            isGlobal: true,
          }),
        ],
      }).compile();

      const client = module.get(UNIPILE_CLIENT);
      expect(client).toBeDefined();

      await module.close();
    });
  });
});
