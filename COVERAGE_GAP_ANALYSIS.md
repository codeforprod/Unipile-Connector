# Coverage Gap Analysis: Unipile Connector Core Package

**Target:** Achieve 80% branch coverage (currently at 59.56%)
**Gap:** 20.44% additional branch coverage needed
**Estimated Additional Tests:** 25-30 test cases

---

## Priority 1: HttpClient Error Handling (Critical)

**Current Branch Coverage:** 65.15%
**Target:** 80%
**Uncovered Lines:** 88-91, 114-133, 184-198, 267-268, 276-277, 292, 326, 339-353

### Missing Test Cases

#### 1.1 Rate Limit Without Retry Enabled

```typescript
// TEST CASE: Should throw RateLimitError when retry disabled
it('should throw RateLimitError immediately when retry is disabled', async () => {
  const client = new HttpClient({
    dsn: 'api.example.com:443',
    apiKey: 'test-key',
    enableRetry: false,  // Key: retry disabled
  });

  // Simulate rate limit state
  client.getRateLimiter().recordRateLimitError('acc-1', new Date(Date.now() + 5000));

  await expect(
    client.request({ method: 'GET', path: '/test', accountId: 'acc-1' })
  ).rejects.toThrow(RateLimitError);
});
```

**Lines Covered:** 88-91

#### 1.2 Retry Logic with RateLimitError

```typescript
// TEST CASE: Should retry after RateLimitError with backoff
it('should retry request after rate limit error with proper backoff', async () => {
  const client = new HttpClient({
    dsn: 'api.example.com:443',
    apiKey: 'test-key',
    enableRetry: true,
    maxRetries: 3,
  });

  mockFetch
    .mockRejectedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '1' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ success: true }),
    });

  const result = await client.get('/test', {}, 'acc-1');

  expect(result.data).toEqual({ success: true });
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
```

**Lines Covered:** 114-121

#### 1.3 Exponential Backoff for Retryable Errors

```typescript
// TEST CASE: Should apply exponential backoff for retryable errors
it('should apply exponential backoff for connection errors', async () => {
  const client = new HttpClient({
    dsn: 'api.example.com:443',
    apiKey: 'test-key',
    enableRetry: true,
    maxRetries: 3,
  });

  const connectionError = new Error('ECONNREFUSED');

  mockFetch
    .mockRejectedValueOnce(connectionError)
    .mockRejectedValueOnce(connectionError)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ success: true }),
    });

  const startTime = Date.now();
  await client.get('/test');
  const elapsed = Date.now() - startTime;

  // Should have exponential backoff: 1000ms + 2000ms = ~3000ms
  expect(elapsed).toBeGreaterThanOrEqual(3000);
  expect(mockFetch).toHaveBeenCalledTimes(3);
});
```

**Lines Covered:** 123-126

#### 1.4 Connection Error Detection

```typescript
// TEST CASE: Should detect and wrap ECONNREFUSED errors
it('should throw ConnectionError for ECONNREFUSED', async () => {
  mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

  await expect(httpClient.get('/test')).rejects.toThrow(ConnectionError);
});

// TEST CASE: Should detect and wrap ENOTFOUND errors
it('should throw ConnectionError for ENOTFOUND', async () => {
  mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND'));

  await expect(httpClient.get('/test')).rejects.toThrow(ConnectionError);
});

// TEST CASE: Should detect and wrap network errors
it('should throw ConnectionError for network failures', async () => {
  mockFetch.mockRejectedValueOnce(new Error('network timeout'));

  await expect(httpClient.get('/test')).rejects.toThrow(ConnectionError);
});
```

**Lines Covered:** 184-194

#### 1.5 Unknown Error Handling

```typescript
// TEST CASE: Should wrap unknown errors in UnipileError
it('should wrap unknown errors in UnipileError', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Unexpected error'));

  await expect(httpClient.get('/test')).rejects.toThrow(UnipileError);
  await expect(httpClient.get('/test')).rejects.toMatchObject({
    category: ErrorCategory.UNKNOWN,
  });
});

// TEST CASE: Should handle non-Error objects
it('should handle non-Error thrown objects', async () => {
  mockFetch.mockRejectedValueOnce('string error');

  await expect(httpClient.get('/test')).rejects.toThrow(UnipileError);
});
```

**Lines Covered:** 198-204

**Total New Tests for HttpClient:** 8-10 tests
**Expected Branch Coverage Increase:** ~10-15%

---

## Priority 2: Account Service Alternative Authentication Methods

**Current Branch Coverage:** 50%
**Target:** 80%
**Uncovered Lines:** 82-118, 178

### Missing Test Cases

#### 2.1 Cookie-Based Authentication

```typescript
// TEST CASE: Should connect account using cookies
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

// TEST CASE: Should handle checkpoint when connecting with cookies
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
```

**Lines Covered:** 82-87

#### 2.2 QR Code Authentication

```typescript
// TEST CASE: Should initiate QR code connection
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
  expect(result.qrCode).toBeDefined();
});
```

**Lines Covered:** 94-100

#### 2.3 IMAP Email Connection

```typescript
// TEST CASE: Should connect generic IMAP email account
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

// TEST CASE: Should default to SSL enabled for IMAP
it('should use SSL by default when useSsl not specified', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { id: 'acc-1', provider: AccountProvider.IMAP }
  });

  await accountService.connectImap({
    provider: AccountProvider.IMAP,
    imapHost: 'imap.example.com',
    imapPort: 993,
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    email: 'test@example.com',
    password: 'password',
    // useSsl omitted - should default to true
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/accounts',
    expect.objectContaining({ use_ssl: true })
  );
});
```

**Lines Covered:** 107-119

**Total New Tests for AccountService:** 5 tests
**Expected Branch Coverage Increase:** ~5-8%

---

## Priority 3: LinkedIn Service Filter Parameters

**Current Branch Coverage:** 29.03%
**Target:** 80%
**Uncovered Lines:** 304-399

### Missing Test Cases

#### 3.1 Company Search Advanced Filters

```typescript
// TEST CASE: Should apply revenue range filter
it('should search companies with revenue range filter', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchCompanies({
    accountId: 'acc-1',
    filters: {
      revenueRange: { min: 1000000, max: 10000000 },
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/companies',
    expect.objectContaining({
      filters: expect.objectContaining({
        revenue: { min: 1000000, max: 10000000 },
      }),
    })
  );
});

// TEST CASE: Should apply growth rate filter
it('should search companies with growth rate filter', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchCompanies({
    accountId: 'acc-1',
    filters: {
      growthRate: 'high',
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/companies',
    expect.objectContaining({
      filters: expect.objectContaining({
        growth_rate: 'high',
      }),
    })
  );
});

// TEST CASE: Should apply technologies filter
it('should search companies with technologies filter', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchCompanies({
    accountId: 'acc-1',
    filters: {
      technologies: ['React', 'Node.js', 'AWS'],
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/companies',
    expect.objectContaining({
      filters: expect.objectContaining({
        technologies: ['React', 'Node.js', 'AWS'],
      }),
    })
  );
});

// TEST CASE: Should apply department headcount filter
it('should search companies with department headcount filter', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchCompanies({
    accountId: 'acc-1',
    filters: {
      departmentHeadcount: {
        department: 'Engineering',
        min: 50,
        max: 200,
      },
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/companies',
    expect.objectContaining({
      filters: expect.objectContaining({
        department_headcount: {
          department: 'Engineering',
          min: 50,
          max: 200,
        },
      }),
    })
  );
});

// TEST CASE: Should apply fortune ranking filter
it('should search companies with fortune ranking', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchCompanies({
    accountId: 'acc-1',
    filters: {
      fortuneRanking: 500,
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/companies',
    expect.objectContaining({
      filters: expect.objectContaining({
        fortune_ranking: 500,
      }),
    })
  );
});

// TEST CASE: Should apply boolean filters
it('should search companies with boolean filters', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchCompanies({
    accountId: 'acc-1',
    filters: {
      isHiring: true,
      recentlyFunded: true,
      hasJobOpenings: true,
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/companies',
    expect.objectContaining({
      filters: expect.objectContaining({
        is_hiring: true,
        recently_funded: true,
        has_job_openings: true,
      }),
    })
  );
});
```

**Lines Covered:** 303-333 (company filters)

#### 3.2 People Search Advanced Filters

```typescript
// TEST CASE: Should apply years of experience filter
it('should search people with years of experience range', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchPeople({
    accountId: 'acc-1',
    filters: {
      yearsOfExperience: { min: 5, max: 10 },
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/people',
    expect.objectContaining({
      filters: expect.objectContaining({
        years_of_experience: { min: 5, max: 10 },
      }),
    })
  );
});

// TEST CASE: Should apply years in current position filter
it('should search people with years in current position', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchPeople({
    accountId: 'acc-1',
    filters: {
      yearsInCurrentPosition: { min: 1, max: 3 },
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/people',
    expect.objectContaining({
      filters: expect.objectContaining({
        years_in_current_position: { min: 1, max: 3 },
      }),
    })
  );
});

// TEST CASE: Should apply years at current company filter
it('should search people with years at current company', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchPeople({
    accountId: 'acc-1',
    filters: {
      yearsAtCurrentCompany: { min: 2, max: 5 },
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/people',
    expect.objectContaining({
      filters: expect.objectContaining({
        years_at_current_company: { min: 2, max: 5 },
      }),
    })
  );
});

// TEST CASE: Should apply connection degree filter
it('should search people by connection degree', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchPeople({
    accountId: 'acc-1',
    filters: {
      connectionDegree: 2,
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/people',
    expect.objectContaining({
      filters: expect.objectContaining({
        connection_degree: 2,
      }),
    })
  );
});

// TEST CASE: Should apply people boolean filters
it('should search people with activity filters', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchPeople({
    accountId: 'acc-1',
    filters: {
      changedJobsRecently: true,
      postedRecently: true,
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/people',
    expect.objectContaining({
      filters: expect.objectContaining({
        changed_jobs_recently: true,
        posted_recently: true,
      }),
    })
  );
});

// TEST CASE: Should apply profile language filter
it('should search people by profile language', async () => {
  mockHttpClient.post.mockResolvedValue({
    data: { results: [], cursor: null },
  });

  await linkedInService.searchPeople({
    accountId: 'acc-1',
    filters: {
      profileLanguage: 'en',
    },
  });

  expect(mockHttpClient.post).toHaveBeenCalledWith(
    '/api/v1/linkedin/acc-1/search/people',
    expect.objectContaining({
      filters: expect.objectContaining({
        profile_language: 'en',
      }),
    })
  );
});
```

**Lines Covered:** 344-399 (people filters)

**Total New Tests for LinkedInService:** 12-15 tests
**Expected Branch Coverage Increase:** ~15-20%

---

## Priority 4: Email and Messaging Services

**Email Branch Coverage:** 33.33%
**Messaging Branch Coverage:** 33.33%
**Target:** 80%

### Missing Test Cases

#### 4.1 Email Service Optional Parameters

```typescript
// TEST CASE: Should update email with partial properties
it('should update email with only specified properties', async () => {
  mockHttpClient.patch.mockResolvedValue({ data: {} });

  await emailService.update('email-1', 'acc-1', {
    isRead: true,
    // Other properties omitted
  });

  expect(mockHttpClient.patch).toHaveBeenCalledWith(
    '/api/v1/accounts/acc-1/emails/email-1',
    expect.objectContaining({
      is_read: true,
    })
  );
});

// TEST CASE: Should apply all email list filters
it('should list emails with complex filters', async () => {
  mockHttpClient.get.mockResolvedValue({
    data: { items: [], cursor: null },
  });

  await emailService.list('acc-1', {
    folderId: 'folder-1',
    isRead: false,
    hasAttachment: true,
    from: 'sender@example.com',
    subject: 'important',
    limit: 50,
  });

  expect(mockHttpClient.get).toHaveBeenCalledWith(
    '/api/v1/accounts/acc-1/emails',
    expect.objectContaining({
      folder_id: 'folder-1',
      is_read: false,
      has_attachment: true,
      from: 'sender@example.com',
      subject: 'important',
      limit: 50,
    })
  );
});
```

#### 4.2 Messaging Service Optional Parameters

```typescript
// TEST CASE: Should list chats with all filters
it('should list chats with complex filters', async () => {
  mockHttpClient.get.mockResolvedValue({
    data: { items: [], cursor: null },
  });

  await messagingService.listChats('acc-1', {
    isArchived: false,
    isRead: false,
    search: 'keyword',
    limit: 25,
  });

  expect(mockHttpClient.get).toHaveBeenCalledWith(
    '/api/v1/accounts/acc-1/chats',
    expect.objectContaining({
      is_archived: false,
      is_read: false,
      search: 'keyword',
      limit: 25,
    })
  );
});
```

**Total New Tests for Email/Messaging:** 4-6 tests
**Expected Branch Coverage Increase:** ~5-8%

---

## Summary: Test Implementation Plan

### Phase 1: Critical Error Handling (Week 1)
- **HttpClient error paths:** 8-10 tests
- **Expected improvement:** +10-15% branch coverage
- **Effort:** 3-4 hours

### Phase 2: Authentication Methods (Week 1)
- **Alternative auth flows:** 5 tests
- **Expected improvement:** +5-8% branch coverage
- **Effort:** 2-3 hours

### Phase 3: LinkedIn Filters (Week 2)
- **Company and people search filters:** 12-15 tests
- **Expected improvement:** +15-20% branch coverage
- **Effort:** 4-5 hours

### Phase 4: Email/Messaging Parameters (Week 2)
- **Optional parameter combinations:** 4-6 tests
- **Expected improvement:** +5-8% branch coverage
- **Effort:** 1-2 hours

### Total Effort Estimate
- **Total new tests:** 29-36 tests
- **Expected final coverage:** 80-85% branch coverage
- **Total development time:** 10-14 hours
- **Testing and validation:** 2-3 hours
- **Total project time:** 12-17 hours

---

## Configuration Changes Required

### Update jest.config.js in @unipile/core

```javascript
coverageThreshold: {
  global: {
    branches: 80,    // Changed from 55 to 80
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

---

## Testing Strategy

1. **Incremental Implementation**
   - Implement tests in priority order
   - Run coverage after each phase
   - Adjust if coverage targets met early

2. **Test Data Management**
   - Create test fixture factory for complex objects
   - Reuse mock data across similar tests
   - Document expected API contracts

3. **Continuous Validation**
   - Run full test suite after each change
   - Monitor coverage reports in CI/CD
   - Ensure no regression in existing tests

---

**Document Version:** 1.0
**Created:** 2026-01-17
**Last Updated:** 2026-01-17
