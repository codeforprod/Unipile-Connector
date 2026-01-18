import { jest } from '@jest/globals';
import { LinkedInService } from './linkedin.service.js';
import type { HttpClient } from '../http/http-client.js';
import type { Mock } from 'jest-mock';

type MockedHttpClient = {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
  request: Mock;
};

describe('LinkedInService', () => {
  let linkedInService: LinkedInService;
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

    linkedInService = new LinkedInService(mockHttpClient as unknown as HttpClient);
  });

  describe('searchCompanies', () => {
    it('should search companies with filters', async () => {
      const mockResult = {
        companies: [
          { urn: 'urn:li:company:123', name: 'Test Company' },
          { urn: 'urn:li:company:456', name: 'Another Company' },
        ],
        totalCount: 100,
        cursor: 'next-cursor',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockResult });

      const result = await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          keywords: 'technology',
          industries: ['Technology'],
          locations: ['San Francisco'],
          employeeCountRange: { min: 100, max: 500 },
        },
        limit: 25,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          account_id: 'linkedin-acc-1',
          limit: 25,
          filters: expect.objectContaining({
            keywords: 'technology',
            industries: ['Technology'],
            locations: ['San Francisco'],
            employee_count: { min: 100, max: 500 },
          }),
        }),
        'linkedin-acc-1',
      );
      expect(result.companies).toHaveLength(2);
      expect(result.totalCount).toBe(100);
    });
  });

  describe('searchPeople', () => {
    it('should search people with filters', async () => {
      const mockResult = {
        people: [
          { urn: 'urn:li:person:123', firstName: 'John', lastName: 'Doe' },
          { urn: 'urn:li:person:456', firstName: 'Jane', lastName: 'Smith' },
        ],
        totalCount: 50,
        cursor: 'next-cursor',
      };
      mockHttpClient.post.mockResolvedValue({ data: mockResult });

      const result = await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          titles: ['CEO', 'CTO'],
          seniorityLevels: ['VP', 'Director'],
          locations: ['New York'],
          yearsOfExperience: { min: 5 },
        },
        limit: 25,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          account_id: 'linkedin-acc-1',
          limit: 25,
          filters: expect.objectContaining({
            titles: ['CEO', 'CTO'],
            seniority_levels: ['VP', 'Director'],
            locations: ['New York'],
            years_of_experience: { min: 5, max: undefined },
          }),
        }),
        'linkedin-acc-1',
      );
      expect(result.people).toHaveLength(2);
    });
  });

  describe('enrichCompany', () => {
    it('should enrich company profile', async () => {
      const mockCompany = {
        urn: 'urn:li:company:123',
        name: 'Test Company',
        industry: 'Technology',
        employeeCount: 250,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockCompany });

      const result = await linkedInService.enrichCompany({
        accountId: 'linkedin-acc-1',
        companyIdentifier: 'urn:li:company:123',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/companies/enrich',
        {
          account_id: 'linkedin-acc-1',
          identifier: 'urn:li:company:123',
        },
        'linkedin-acc-1',
      );
      expect(result.name).toBe('Test Company');
    });
  });

  describe('enrichPerson', () => {
    it('should enrich person profile', async () => {
      const mockPerson = {
        urn: 'urn:li:person:123',
        firstName: 'John',
        lastName: 'Doe',
        headline: 'CEO at Test Company',
      };
      mockHttpClient.get.mockResolvedValue({ data: mockPerson });

      const result = await linkedInService.enrichPerson({
        accountId: 'linkedin-acc-1',
        personIdentifier: 'urn:li:person:123',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/people/enrich',
        {
          account_id: 'linkedin-acc-1',
          identifier: 'urn:li:person:123',
        },
        'linkedin-acc-1',
      );
      expect(result.firstName).toBe('John');
    });
  });

  describe('getSearchParameters', () => {
    it('should get search parameter values', async () => {
      const mockValues = [
        { id: 'tech-1', name: 'Technology' },
        { id: 'tech-2', name: 'Software' },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { items: mockValues } });

      const result = await linkedInService.getSearchParameters({
        accountId: 'linkedin-acc-1',
        type: 'industry',
        query: 'tech',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/search-parameters',
        {
          account_id: 'linkedin-acc-1',
          type: 'industry',
          query: 'tech',
        },
        'linkedin-acc-1',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('convenience parameter methods', () => {
    beforeEach(() => {
      mockHttpClient.get.mockResolvedValue({
        data: { items: [{ id: '1', name: 'Test' }] },
      });
    });

    it('should get industries', async () => {
      await linkedInService.getIndustries('linkedin-acc-1', 'tech');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/search-parameters',
        expect.objectContaining({ type: 'industry' }),
        'linkedin-acc-1',
      );
    });

    it('should get locations', async () => {
      await linkedInService.getLocations('linkedin-acc-1', 'san');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/search-parameters',
        expect.objectContaining({ type: 'location' }),
        'linkedin-acc-1',
      );
    });

    it('should get company sizes', async () => {
      await linkedInService.getCompanySizes('linkedin-acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/search-parameters',
        expect.objectContaining({ type: 'company_size' }),
        'linkedin-acc-1',
      );
    });

    it('should get seniority levels', async () => {
      await linkedInService.getSeniorityLevels('linkedin-acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/search-parameters',
        expect.objectContaining({ type: 'seniority' }),
        'linkedin-acc-1',
      );
    });

    it('should get functions', async () => {
      await linkedInService.getFunctions('linkedin-acc-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/search-parameters',
        expect.objectContaining({ type: 'function' }),
        'linkedin-acc-1',
      );
    });
  });

  describe('getCompany', () => {
    it('should get company by URN', async () => {
      const mockCompany = { urn: 'urn:li:company:123', name: 'Test' };
      mockHttpClient.get.mockResolvedValue({ data: mockCompany });

      const result = await linkedInService.getCompany('linkedin-acc-1', 'urn:li:company:123');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/companies/urn%3Ali%3Acompany%3A123',
        { account_id: 'linkedin-acc-1' },
        'linkedin-acc-1',
      );
      expect(result.name).toBe('Test');
    });
  });

  describe('getPerson', () => {
    it('should get person by URN', async () => {
      const mockPerson = { urn: 'urn:li:person:123', firstName: 'John' };
      mockHttpClient.get.mockResolvedValue({ data: mockPerson });

      const result = await linkedInService.getPerson('linkedin-acc-1', 'urn:li:person:123');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/people/urn%3Ali%3Aperson%3A123',
        { account_id: 'linkedin-acc-1' },
        'linkedin-acc-1',
      );
      expect(result.firstName).toBe('John');
    });
  });

  describe('getCompanyEmployees', () => {
    it('should get company employees', async () => {
      const mockResult = {
        people: [{ urn: 'urn:li:person:123', firstName: 'John' }],
        totalCount: 10,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockResult });

      const result = await linkedInService.getCompanyEmployees(
        'linkedin-acc-1',
        'urn:li:company:123',
        10,
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/companies/urn%3Ali%3Acompany%3A123/employees',
        {
          account_id: 'linkedin-acc-1',
          limit: 10,
          cursor: undefined,
        },
        'linkedin-acc-1',
      );
      expect(result.people).toHaveLength(1);
    });
  });

  describe('sendConnectionRequest', () => {
    it('should send connection request', async () => {
      mockHttpClient.post.mockResolvedValue({ data: undefined });

      await linkedInService.sendConnectionRequest(
        'linkedin-acc-1',
        'urn:li:person:123',
        'Hi, let us connect!',
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/connections',
        {
          account_id: 'linkedin-acc-1',
          person_urn: 'urn:li:person:123',
          message: 'Hi, let us connect!',
        },
        'linkedin-acc-1',
      );
    });
  });

  describe('endorseSkill', () => {
    it('should endorse a skill', async () => {
      mockHttpClient.post.mockResolvedValue({ data: undefined });

      await linkedInService.endorseSkill('linkedin-acc-1', 'urn:li:person:123', 'JavaScript');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/people/urn%3Ali%3Aperson%3A123/skills/endorse',
        {
          account_id: 'linkedin-acc-1',
          skill: 'JavaScript',
        },
        'linkedin-acc-1',
      );
    });
  });

  describe('searchCompanies advanced filters', () => {
    beforeEach(() => {
      mockHttpClient.post.mockResolvedValue({
        data: { companies: [], totalCount: 0, cursor: null },
      });
    });

    it('should apply revenue range filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          revenueRange: { min: 1000000, max: 10000000 },
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            revenue: { min: 1000000, max: 10000000 },
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply growth rate filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          growthRate: 'high',
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            growth_rate: 'high',
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply technologies filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          technologies: ['React', 'Node.js', 'AWS'],
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            technologies: ['React', 'Node.js', 'AWS'],
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply department headcount filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          departmentHeadcount: {
            department: 'Engineering',
            min: 50,
            max: 200,
          },
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            department_headcount: {
              department: 'Engineering',
              min: 50,
              max: 200,
            },
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply fortune ranking filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          fortuneRanking: 500,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            fortune_ranking: 500,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply isHiring filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          isHiring: true,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            is_hiring: true,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply recentlyFunded filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          recentlyFunded: true,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            recently_funded: true,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply hasJobOpenings filter', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          hasJobOpenings: true,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            has_job_openings: true,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply combined boolean filters', async () => {
      await linkedInService.searchCompanies({
        accountId: 'linkedin-acc-1',
        filters: {
          isHiring: true,
          recentlyFunded: true,
          hasJobOpenings: false,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/companies/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            is_hiring: true,
            recently_funded: true,
            has_job_openings: false,
          }),
        }),
        'linkedin-acc-1',
      );
    });
  });

  describe('searchPeople advanced filters', () => {
    beforeEach(() => {
      mockHttpClient.post.mockResolvedValue({
        data: { people: [], totalCount: 0, cursor: null },
      });
    });

    it('should apply yearsInCurrentPosition filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          yearsInCurrentPosition: { min: 1, max: 3 },
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            years_in_current_position: { min: 1, max: 3 },
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply yearsAtCurrentCompany filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          yearsAtCurrentCompany: { min: 2, max: 5 },
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            years_at_current_company: { min: 2, max: 5 },
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply connectionDegree filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          connectionDegree: 2,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            connection_degree: 2,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply changedJobsRecently filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          changedJobsRecently: true,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            changed_jobs_recently: true,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply postedRecently filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          postedRecently: true,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            posted_recently: true,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply profileLanguage filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          profileLanguage: 'en',
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            profile_language: 'en',
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply combined activity filters', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          changedJobsRecently: true,
          postedRecently: true,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            changed_jobs_recently: true,
            posted_recently: true,
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply functions filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          functions: ['Engineering', 'Product'],
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            functions: ['Engineering', 'Product'],
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply companies filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          companies: ['Google', 'Meta'],
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            companies: ['Google', 'Meta'],
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply companyUrns filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          companyUrns: ['urn:li:company:123', 'urn:li:company:456'],
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            company_urns: ['urn:li:company:123', 'urn:li:company:456'],
          }),
        }),
        'linkedin-acc-1',
      );
    });

    it('should apply schools filter', async () => {
      await linkedInService.searchPeople({
        accountId: 'linkedin-acc-1',
        filters: {
          schools: ['Stanford', 'MIT'],
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/sales-navigator/people/search',
        expect.objectContaining({
          filters: expect.objectContaining({
            schools: ['Stanford', 'MIT'],
          }),
        }),
        'linkedin-acc-1',
      );
    });
  });

  describe('getSearchParameters alternative response format', () => {
    it('should handle values field instead of items', async () => {
      const mockValues = [
        { id: 'loc-1', name: 'San Francisco' },
        { id: 'loc-2', name: 'New York' },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { values: mockValues } });

      const result = await linkedInService.getSearchParameters({
        accountId: 'linkedin-acc-1',
        type: 'location',
      });

      expect(result).toEqual(mockValues);
    });

    it('should return empty array when neither items nor values exist', async () => {
      mockHttpClient.get.mockResolvedValue({ data: {} });

      const result = await linkedInService.getSearchParameters({
        accountId: 'linkedin-acc-1',
        type: 'industry',
      });

      expect(result).toEqual([]);
    });
  });

  describe('sendConnectionRequest without message', () => {
    it('should send connection request without message', async () => {
      mockHttpClient.post.mockResolvedValue({ data: undefined });

      await linkedInService.sendConnectionRequest('linkedin-acc-1', 'urn:li:person:123');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/linkedin/connections',
        {
          account_id: 'linkedin-acc-1',
          person_urn: 'urn:li:person:123',
          message: undefined,
        },
        'linkedin-acc-1',
      );
    });
  });

  describe('getCompanyEmployees with cursor', () => {
    it('should pass cursor for pagination', async () => {
      const mockResult = {
        people: [{ urn: 'urn:li:person:123', firstName: 'John' }],
        totalCount: 100,
      };
      mockHttpClient.get.mockResolvedValue({ data: mockResult });

      await linkedInService.getCompanyEmployees(
        'linkedin-acc-1',
        'urn:li:company:123',
        10,
        'cursor-abc',
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/linkedin/companies/urn%3Ali%3Acompany%3A123/employees',
        {
          account_id: 'linkedin-acc-1',
          limit: 10,
          cursor: 'cursor-abc',
        },
        'linkedin-acc-1',
      );
    });
  });
});
