import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { UnipileModule } from '../unipile.module.js';
import {
  InjectUnipileClient,
  InjectAccountService,
  InjectEmailService,
  InjectMessagingService,
  InjectLinkedInService,
  InjectWebhookService,
} from './inject-unipile.decorator.js';
import type {
  UnipileClient,
  AccountService,
  EmailService,
  MessagingService,
  LinkedInService,
  WebhookService,
} from '@unipile/core';

// Test service that uses all decorators
@Injectable()
class TestService {
  constructor(
    @InjectUnipileClient() public readonly client: UnipileClient,
    @InjectAccountService() public readonly accounts: AccountService,
    @InjectEmailService() public readonly email: EmailService,
    @InjectMessagingService() public readonly messaging: MessagingService,
    @InjectLinkedInService() public readonly linkedin: LinkedInService,
    @InjectWebhookService() public readonly webhooks: WebhookService,
  ) {}
}

describe('Inject Decorators', () => {
  let module: TestingModule;
  let testService: TestService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        UnipileModule.forRoot({
          dsn: 'api.example.com:443',
          apiKey: 'test-api-key',
        }),
      ],
      providers: [TestService],
    }).compile();

    testService = module.get(TestService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should inject UnipileClient via @InjectUnipileClient()', () => {
    expect(testService.client).toBeDefined();
    expect(testService.client.accounts).toBeDefined();
    expect(testService.client.email).toBeDefined();
  });

  it('should inject AccountService via @InjectAccountService()', () => {
    expect(testService.accounts).toBeDefined();
    expect(typeof testService.accounts.list).toBe('function');
    expect(typeof testService.accounts.get).toBe('function');
  });

  it('should inject EmailService via @InjectEmailService()', () => {
    expect(testService.email).toBeDefined();
    expect(typeof testService.email.list).toBe('function');
    expect(typeof testService.email.send).toBe('function');
  });

  it('should inject MessagingService via @InjectMessagingService()', () => {
    expect(testService.messaging).toBeDefined();
    expect(typeof testService.messaging.listChats).toBe('function');
    expect(typeof testService.messaging.sendMessage).toBe('function');
  });

  it('should inject LinkedInService via @InjectLinkedInService()', () => {
    expect(testService.linkedin).toBeDefined();
    expect(typeof testService.linkedin.searchCompanies).toBe('function');
    expect(typeof testService.linkedin.searchPeople).toBe('function');
  });

  it('should inject WebhookService via @InjectWebhookService()', () => {
    expect(testService.webhooks).toBeDefined();
    expect(typeof testService.webhooks.list).toBe('function');
    expect(typeof testService.webhooks.create).toBe('function');
  });
});
