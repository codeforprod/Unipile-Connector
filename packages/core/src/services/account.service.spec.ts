import { jest } from '@jest/globals';
import { AccountService } from './account.service.js';
import type { HttpClient } from '../http/http-client.js';
import { AccountProvider, CheckpointType, AccountStatus } from '../enums/index.js';
import type { Mock } from 'jest-mock';

type MockedHttpClient = {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
  request: Mock;
};

describe('AccountService', () => {
  let accountService: AccountService;
  let mockHttpClient: MockedHttpClient;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    };

    accountService = new AccountService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should list accounts with pagination', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 'acc-1', provider: AccountProvider.LINKEDIN, status: AccountStatus.OK },
            { id: 'acc-2', provider: AccountProvider.GMAIL, status: AccountStatus.OK },
          ],
          cursor: 'next-cursor',
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await accountService.list({ limit: 10, cursor: 'prev-cursor' });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/accounts', {
        limit: 10,
        cursor: 'prev-cursor',
      });
      expect(result.items).toHaveLength(2);
      expect(result.cursor).toBe('next-cursor');
    });
  });

  describe('get', () => {
    it('should get account by ID', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.LINKEDIN,
        status: AccountStatus.OK,
        name: 'Test Account',
      };
      mockHttpClient.get.mockResolvedValue({ data: mockAccount });

      const result = await accountService.get('acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/accounts/acc-1');
      expect(result.id).toBe('acc-1');
    });
  });

  describe('connectOAuth', () => {
    it('should connect account with OAuth', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.GMAIL,
        status: AccountStatus.OK,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAccount });

      const result = await accountService.connectOAuth({
        provider: AccountProvider.GMAIL,
        code: 'oauth-code',
        redirectUri: 'https://example.com/callback',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts', {
        provider: AccountProvider.GMAIL,
        code: 'oauth-code',
        redirect_uri: 'https://example.com/callback',
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('connectCredentials', () => {
    it('should connect account with credentials', async () => {
      const mockCheckpoint = {
        type: CheckpointType.OTP,
        accountId: 'acc-1',
        message: 'Enter OTP',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockCheckpoint });

      const result = await accountService.connectCredentials({
        provider: AccountProvider.LINKEDIN,
        username: 'user@example.com',
        password: 'password123',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts', {
        provider: AccountProvider.LINKEDIN,
        username: 'user@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockCheckpoint);
    });
  });

  describe('resolveCheckpoint', () => {
    it('should resolve OTP checkpoint', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.LINKEDIN,
        status: AccountStatus.OK,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAccount });

      const result = await accountService.resolveCheckpoint({
        accountId: 'acc-1',
        type: CheckpointType.OTP,
        code: '123456',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts/acc-1/checkpoint', {
        type: CheckpointType.OTP,
        code: '123456',
        captcha_solution: undefined,
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('createHostedAuthLink', () => {
    it('should create hosted auth link', async () => {
      const mockLink = {
        url: 'https://auth.unipile.com/hosted/abc123',
        expiresAt: '2024-01-01T12:00:00Z',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockLink });

      const result = await accountService.createHostedAuthLink({
        provider: AccountProvider.GMAIL,
        callbackUrl: 'https://example.com/callback',
        expiresIn: 3600,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/hosted/accounts/link', {
        provider: AccountProvider.GMAIL,
        callback_url: 'https://example.com/callback',
        expires_in: 3600,
        state: undefined,
      });
      expect(result).toEqual(mockLink);
    });
  });

  describe('reconnect', () => {
    it('should reconnect account', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.LINKEDIN,
        status: AccountStatus.CONNECTING,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAccount });

      const result = await accountService.reconnect({ accountId: 'acc-1' });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts/acc-1/reconnect');
      expect(result).toEqual(mockAccount);
    });
  });

  describe('delete', () => {
    it('should delete account', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: undefined });

      await accountService.delete('acc-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/accounts/acc-1');
    });
  });

  describe('isCheckpoint', () => {
    it('should return true for checkpoint response', () => {
      const checkpoint = {
        type: CheckpointType.OTP,
        accountId: 'acc-1',
        message: 'Enter OTP',
      };

      expect(accountService.isCheckpoint(checkpoint)).toBe(true);
    });

    it('should return false for account response', () => {
      const account = {
        id: 'acc-1',
        provider: AccountProvider.LINKEDIN,
        status: AccountStatus.OK,
        name: 'Test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      expect(accountService.isCheckpoint(account)).toBe(false);
    });
  });

  describe('connectCookies', () => {
    it('should connect account with session cookies', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.INSTAGRAM,
        status: AccountStatus.OK,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAccount });

      const result = await accountService.connectCookies({
        provider: AccountProvider.INSTAGRAM,
        cookies: 'sessionid=abc123; csrftoken=xyz789',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts', {
        provider: AccountProvider.INSTAGRAM,
        cookies: 'sessionid=abc123; csrftoken=xyz789',
      });
      expect(result).toEqual(mockAccount);
    });

    it('should return checkpoint when cookie auth requires 2FA', async () => {
      const mockCheckpoint = {
        type: CheckpointType.OTP,
        accountId: 'acc-1',
        message: 'Enter verification code',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockCheckpoint });

      const result = await accountService.connectCookies({
        provider: AccountProvider.INSTAGRAM,
        cookies: 'sessionid=abc123',
      });

      expect(accountService.isCheckpoint(result)).toBe(true);
    });
  });

  describe('connectQrCode', () => {
    it('should initiate QR code connection for WhatsApp', async () => {
      const mockCheckpoint = {
        type: CheckpointType.QR_CODE,
        accountId: 'acc-1',
        qrCode: 'data:image/png;base64,iVBORw0KG...',
        message: 'Scan QR code with your phone',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockCheckpoint });

      const result = await accountService.connectQrCode({
        provider: AccountProvider.WHATSAPP,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts', {
        provider: AccountProvider.WHATSAPP,
        connection_type: 'qr_code',
      });
      expect(result.type).toBe(CheckpointType.QR_CODE);
    });
  });

  describe('connectImap', () => {
    it('should connect IMAP account with full credentials', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.IMAP,
        status: AccountStatus.OK,
        name: 'custom@mail.com',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAccount });

      const result = await accountService.connectImap({
        provider: AccountProvider.IMAP,
        imapHost: 'imap.custom-mail.com',
        imapPort: 993,
        smtpHost: 'smtp.custom-mail.com',
        smtpPort: 465,
        email: 'custom@mail.com',
        password: 'secure-password',
        useSsl: true,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts', {
        provider: AccountProvider.IMAP,
        imap_host: 'imap.custom-mail.com',
        imap_port: 993,
        smtp_host: 'smtp.custom-mail.com',
        smtp_port: 465,
        email: 'custom@mail.com',
        password: 'secure-password',
        use_ssl: true,
      });
      expect(result).toEqual(mockAccount);
    });

    it('should default to SSL enabled when useSsl not specified', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: { id: 'acc-1', provider: AccountProvider.IMAP },
      });

      await accountService.connectImap({
        provider: AccountProvider.IMAP,
        imapHost: 'imap.example.com',
        imapPort: 993,
        smtpHost: 'smtp.example.com',
        smtpPort: 465,
        email: 'test@example.com',
        password: 'password',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/accounts',
        expect.objectContaining({ use_ssl: true }),
      );
    });

    it('should allow SSL to be disabled explicitly', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: { id: 'acc-1', provider: AccountProvider.IMAP },
      });

      await accountService.connectImap({
        provider: AccountProvider.IMAP,
        imapHost: 'imap.example.com',
        imapPort: 143,
        smtpHost: 'smtp.example.com',
        smtpPort: 25,
        email: 'test@example.com',
        password: 'password',
        useSsl: false,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/accounts',
        expect.objectContaining({ use_ssl: false }),
      );
    });
  });

  describe('resync', () => {
    it('should resynchronize account data', async () => {
      mockHttpClient.post.mockResolvedValue({ data: undefined });

      await accountService.resync('acc-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/accounts/acc-1/resync',
        undefined,
        'acc-1',
      );
    });
  });

  describe('list with default options', () => {
    it('should list accounts without options', async () => {
      const mockResponse = {
        data: {
          items: [{ id: 'acc-1', provider: AccountProvider.LINKEDIN, status: AccountStatus.OK }],
          cursor: null,
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await accountService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/accounts', {
        limit: undefined,
        cursor: undefined,
      });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('resolveCheckpoint with captcha', () => {
    it('should resolve captcha checkpoint', async () => {
      const mockAccount = {
        id: 'acc-1',
        provider: AccountProvider.LINKEDIN,
        status: AccountStatus.OK,
      };
      mockHttpClient.post.mockResolvedValue({ data: mockAccount });

      const result = await accountService.resolveCheckpoint({
        accountId: 'acc-1',
        type: CheckpointType.CAPTCHA,
        captchaSolution: 'captcha-solution-token',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/accounts/acc-1/checkpoint', {
        type: CheckpointType.CAPTCHA,
        code: undefined,
        captcha_solution: 'captcha-solution-token',
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('createHostedAuthLink with state', () => {
    it('should create hosted auth link with state parameter', async () => {
      const mockLink = {
        url: 'https://auth.unipile.com/hosted/abc123',
        expiresAt: '2024-01-01T12:00:00Z',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockLink });

      const result = await accountService.createHostedAuthLink({
        provider: AccountProvider.GMAIL,
        callbackUrl: 'https://example.com/callback',
        expiresIn: 3600,
        state: 'custom-state-value',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/hosted/accounts/link', {
        provider: AccountProvider.GMAIL,
        callback_url: 'https://example.com/callback',
        expires_in: 3600,
        state: 'custom-state-value',
      });
      expect(result).toEqual(mockLink);
    });
  });
});
