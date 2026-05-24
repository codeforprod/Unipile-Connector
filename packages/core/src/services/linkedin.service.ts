import type { HttpClient } from '../http/http-client.js';
import type {
  LinkedInCompany,
  LinkedInPerson,
  CompanySearchRequest,
  PeopleSearchRequest,
  CompanySearchResult,
  PeopleSearchResult,
  SearchParameterValue,
  SearchParameterType,
  GetSearchParametersRequest,
  EnrichCompanyRequest,
  EnrichPersonRequest,
  CreatePostCommentRequest,
  GetLinkedInSearchParametersV2Request,
  LinkedInRouteGroup,
  LinkedInSearchV2Request,
  ListPostsRequest,
  RawLinkedInRequest,
  ReactToPostRequest,
  SendInvitationRequest,
} from '../interfaces/index.js';

/**
 * API response shape for search parameters.
 */
interface SearchParametersResponse {
  items?: SearchParameterValue[];
  values?: SearchParameterValue[];
}

/**
 * Service for LinkedIn Sales Navigator operations.
 * Handles company/people search, profile enrichment, and search parameter retrieval.
 */
export class LinkedInService {
  constructor(private readonly httpClient: HttpClient) {}

  private isV2(): boolean {
    return this.httpClient.getApiVersion?.() === 'v2';
  }

  private accountPath(accountId: string, path: string): string {
    return `/${encodeURIComponent(accountId)}${path}`;
  }

  private linkedInSearchBase(routeGroup: LinkedInRouteGroup): string {
    if (routeGroup === 'classic') {
      return '/linkedin/search';
    }

    return `/linkedin/${routeGroup}/search`;
  }

  /**
   * Searches for companies using Sales Navigator filters.
   * @param request - Company search parameters
   * @returns Search results with pagination
   */
  async searchCompanies(request: CompanySearchRequest): Promise<CompanySearchResult> {
    const response = await this.httpClient.post<CompanySearchResult>(
      '/api/v1/linkedin/sales-navigator/companies/search',
      {
        account_id: request.accountId,
        filters: this.buildCompanyFilters(request.filters),
        limit: request.limit,
        cursor: request.cursor,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Searches for people/leads using Sales Navigator filters.
   * @param request - People search parameters
   * @returns Search results with pagination
   */
  async searchPeople(request: PeopleSearchRequest): Promise<PeopleSearchResult> {
    const response = await this.httpClient.post<PeopleSearchResult>(
      '/api/v1/linkedin/sales-navigator/people/search',
      {
        account_id: request.accountId,
        filters: this.buildPeopleFilters(request.filters),
        limit: request.limit,
        cursor: request.cursor,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Enriches a company profile with detailed information.
   * @param request - Company enrichment parameters
   * @returns Enriched company profile
   */
  async enrichCompany(request: EnrichCompanyRequest): Promise<LinkedInCompany> {
    if (this.isV2()) {
      return this.getCompanyV2(request.accountId, request.companyIdentifier);
    }

    const response = await this.httpClient.get<LinkedInCompany>(
      '/api/v1/linkedin/companies/enrich',
      {
        account_id: request.accountId,
        identifier: request.companyIdentifier,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Enriches a person profile with detailed information.
   * @param request - Person enrichment parameters
   * @returns Enriched person profile
   */
  async enrichPerson(request: EnrichPersonRequest): Promise<LinkedInPerson> {
    if (this.isV2()) {
      return this.getProfileV2(request.accountId, request.personIdentifier);
    }

    const response = await this.httpClient.get<LinkedInPerson>(
      '/api/v1/linkedin/people/enrich',
      {
        account_id: request.accountId,
        identifier: request.personIdentifier,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Gets available search parameter values for dynamic dropdowns.
   * @param request - Search parameters request
   * @returns List of parameter values
   */
  async getSearchParameters(request: GetSearchParametersRequest): Promise<SearchParameterValue[]> {
    if (this.isV2()) {
      return this.getSearchParametersV2({
        accountId: request.accountId,
        routeGroup: 'sales-navigator',
        type: request.type,
        query: request.query,
      });
    }

    const response = await this.httpClient.get<SearchParametersResponse>(
      '/api/v1/linkedin/sales-navigator/search-parameters',
      {
        account_id: request.accountId,
        type: request.type,
        query: request.query,
      },
      request.accountId,
    );
    return response.data.items ?? response.data.values ?? [];
  }

  /**
   * Gets industry search parameters.
   * @param accountId - LinkedIn account identifier
   * @param query - Optional search query
   * @returns List of industry values
   */
  async getIndustries(accountId: string, query?: string): Promise<SearchParameterValue[]> {
    return this.getSearchParameters({
      accountId,
      type: 'industry' as SearchParameterType,
      query,
    });
  }

  /**
   * Gets location search parameters.
   * @param accountId - LinkedIn account identifier
   * @param query - Optional search query
   * @returns List of location values
   */
  async getLocations(accountId: string, query?: string): Promise<SearchParameterValue[]> {
    return this.getSearchParameters({
      accountId,
      type: 'location' as SearchParameterType,
      query,
    });
  }

  /**
   * Gets company size search parameters.
   * @param accountId - LinkedIn account identifier
   * @returns List of company size values
   */
  async getCompanySizes(accountId: string): Promise<SearchParameterValue[]> {
    return this.getSearchParameters({
      accountId,
      type: 'company_size' as SearchParameterType,
    });
  }

  /**
   * Gets seniority level search parameters.
   * @param accountId - LinkedIn account identifier
   * @returns List of seniority values
   */
  async getSeniorityLevels(accountId: string): Promise<SearchParameterValue[]> {
    return this.getSearchParameters({
      accountId,
      type: 'seniority' as SearchParameterType,
    });
  }

  /**
   * Gets job function search parameters.
   * @param accountId - LinkedIn account identifier
   * @returns List of function values
   */
  async getFunctions(accountId: string): Promise<SearchParameterValue[]> {
    return this.getSearchParameters({
      accountId,
      type: 'function' as SearchParameterType,
    });
  }

  /**
   * Gets a company profile by URN.
   * @param accountId - LinkedIn account identifier
   * @param companyUrn - Company URN
   * @returns Company profile
   */
  async getCompany(accountId: string, companyUrn: string): Promise<LinkedInCompany> {
    if (this.isV2()) {
      return this.getCompanyV2(accountId, companyUrn);
    }

    const response = await this.httpClient.get<LinkedInCompany>(
      `/api/v1/linkedin/companies/${encodeURIComponent(companyUrn)}`,
      { account_id: accountId },
      accountId,
    );
    return response.data;
  }

  /**
   * Gets a person profile by URN.
   * @param accountId - LinkedIn account identifier
   * @param personUrn - Person URN
   * @returns Person profile
   */
  async getPerson(accountId: string, personUrn: string): Promise<LinkedInPerson> {
    if (this.isV2()) {
      return this.getProfileV2(accountId, personUrn);
    }

    const response = await this.httpClient.get<LinkedInPerson>(
      `/api/v1/linkedin/people/${encodeURIComponent(personUrn)}`,
      { account_id: accountId },
      accountId,
    );
    return response.data;
  }

  /**
   * Gets employees of a company.
   * @param accountId - LinkedIn account identifier
   * @param companyUrn - Company URN
   * @param limit - Maximum results
   * @param cursor - Pagination cursor
   * @returns People search result
   */
  async getCompanyEmployees(
    accountId: string,
    companyUrn: string,
    limit?: number,
    cursor?: string,
  ): Promise<PeopleSearchResult> {
    const response = await this.httpClient.get<PeopleSearchResult>(
      `/api/v1/linkedin/companies/${encodeURIComponent(companyUrn)}/employees`,
      {
        account_id: accountId,
        limit,
        cursor,
      },
      accountId,
    );
    return response.data;
  }

  /**
   * Sends a connection request to a person.
   * @param accountId - LinkedIn account identifier
   * @param personUrn - Person URN
   * @param message - Optional connection message
   */
  async sendConnectionRequest(
    accountId: string,
    personUrn: string,
    message?: string,
  ): Promise<void> {
    await this.httpClient.post(
      '/api/v1/linkedin/connections',
      {
        account_id: accountId,
        person_urn: personUrn,
        message,
      },
      accountId,
    );
  }

  /**
   * Endorses a skill on a person's profile.
   * @param accountId - LinkedIn account identifier
   * @param personUrn - Person URN
   * @param skillName - Skill to endorse
   */
  async endorseSkill(accountId: string, personUrn: string, skillName: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/linkedin/people/${encodeURIComponent(personUrn)}/skills/endorse`,
      {
        account_id: accountId,
        skill: skillName,
      },
      accountId,
    );
  }

  /**
   * Sends a raw v2 LinkedIn passthrough request.
   * @param request - Raw LinkedIn request
   * @returns Raw response from Unipile
   */
  async rawRequest<T = unknown>(request: RawLinkedInRequest): Promise<T> {
    const response = await this.httpClient.post<T>(
      this.accountPath(request.accountId, '/linkedin'),
      {
        url: request.url,
        method: request.method,
        body: request.body,
        headers: request.headers,
        bypass_url_encoding: request.bypassUrlEncoding,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Gets a v2 LinkedIn company profile by company ID.
   * @param accountId - Account ID
   * @param companyId - Company ID
   * @returns Company profile
   */
  async getCompanyV2(accountId: string, companyId: string): Promise<LinkedInCompany> {
    const response = await this.httpClient.get<LinkedInCompany>(
      this.accountPath(accountId, `/linkedin/company/${encodeURIComponent(companyId)}`),
      {},
      accountId,
    );
    return response.data;
  }

  /**
   * Gets a v2 LinkedIn user/profile by user ID.
   * @param accountId - Account ID
   * @param userId - User ID
   * @returns Person profile
   */
  async getProfileV2(accountId: string, userId: string): Promise<LinkedInPerson> {
    const response = await this.httpClient.get<LinkedInPerson>(
      this.accountPath(accountId, `/users/${encodeURIComponent(userId)}`),
      {},
      accountId,
    );
    return response.data;
  }

  /**
   * Gets v2 LinkedIn InMail credits.
   * @param accountId - Account ID
   * @returns InMail credit response
   */
  async getInMailCreditsV2<T = unknown>(accountId: string): Promise<T> {
    const response = await this.httpClient.get<T>(
      this.accountPath(accountId, '/linkedin/inmail-credits'),
      {},
      accountId,
    );
    return response.data;
  }

  /**
   * Gets product-specific v2 LinkedIn search parameters.
   * @param request - Search parameter request
   * @returns Search parameter values
   */
  async getSearchParametersV2(
    request: GetLinkedInSearchParametersV2Request,
  ): Promise<SearchParameterValue[]> {
    const response = await this.httpClient.get<SearchParametersResponse>(
      this.accountPath(
        request.accountId,
        `${this.linkedInSearchBase(request.routeGroup)}/parameters`,
      ),
      {
        type: request.type,
        query: request.query,
        limit: request.limit,
      },
      request.accountId,
    );
    return response.data.items ?? response.data.values ?? [];
  }

  /**
   * Runs a generic v2 LinkedIn search in a product-specific route group.
   * @param request - v2 search request
   * @returns Raw search response
   */
  async searchV2<T = unknown>(request: LinkedInSearchV2Request): Promise<T> {
    const response = await this.httpClient.post<T>(
      this.accountPath(request.accountId, this.linkedInSearchBase(request.routeGroup)),
      {
        filters: request.filters,
        url: request.url,
        limit: request.limit,
        offset: request.offset,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Sends a v2 invitation request.
   * @param request - Invitation request
   */
  async sendInvitation(request: SendInvitationRequest): Promise<void> {
    await this.httpClient.post(
      this.accountPath(request.accountId, '/users/invite'),
      {
        user_id: request.userId,
        message: request.message,
        user_email: request.userEmail,
      },
      request.accountId,
    );
  }

  /**
   * Lists v2 social posts for a user or company.
   * @param request - Post list request
   * @returns Raw post list response
   */
  async listPosts<T = unknown>(request: ListPostsRequest): Promise<T> {
    const response = await this.httpClient.get<T>(
      this.accountPath(request.accountId, `/users/${encodeURIComponent(request.userId)}/posts`),
      {
        limit: request.limit,
        cursor: request.cursor,
        offset: request.offset,
      },
      request.accountId,
    );
    return response.data;
  }

  /**
   * Adds a v2 reaction to a post.
   * @param request - Reaction request
   */
  async reactToPost(request: ReactToPostRequest): Promise<void> {
    await this.httpClient.post(
      this.accountPath(request.accountId, `/posts/${encodeURIComponent(request.postId)}/reactions`),
      {
        reaction: request.reaction,
        react_as: request.reactAs,
      },
      request.accountId,
    );
  }

  /**
   * Lists v2 comments for a post.
   * @param accountId - Account ID
   * @param postId - Post ID
   * @returns Raw comment list response
   */
  async listPostComments<T = unknown>(accountId: string, postId: string): Promise<T> {
    const response = await this.httpClient.get<T>(
      this.accountPath(accountId, `/posts/${encodeURIComponent(postId)}/comments`),
      {},
      accountId,
    );
    return response.data;
  }

  /**
   * Creates a v2 post comment.
   * @param request - Comment request
   */
  async createPostComment(request: CreatePostCommentRequest): Promise<void> {
    await this.httpClient.post(
      this.accountPath(request.accountId, `/posts/${encodeURIComponent(request.postId)}/comments`),
      { text: request.text },
      request.accountId,
    );
  }

  /**
   * Builds company search filters in API format.
   */
  private buildCompanyFilters(filters: CompanySearchRequest['filters']): Record<string, unknown> {
    const apiFilters: Record<string, unknown> = {};

    if (filters.keywords !== undefined) {
      apiFilters['keywords'] = filters.keywords;
    }
    if (filters.industries !== undefined) {
      apiFilters['industries'] = filters.industries;
    }
    if (filters.locations !== undefined) {
      apiFilters['locations'] = filters.locations;
    }
    if (filters.employeeCountRange !== undefined) {
      apiFilters['employee_count'] = {
        min: filters.employeeCountRange.min,
        max: filters.employeeCountRange.max,
      };
    }
    if (filters.revenueRange !== undefined) {
      apiFilters['revenue'] = {
        min: filters.revenueRange.min,
        max: filters.revenueRange.max,
      };
    }
    if (filters.growthRate !== undefined) {
      apiFilters['growth_rate'] = filters.growthRate;
    }
    if (filters.technologies !== undefined) {
      apiFilters['technologies'] = filters.technologies;
    }
    if (filters.departmentHeadcount !== undefined) {
      apiFilters['department_headcount'] = {
        department: filters.departmentHeadcount.department,
        min: filters.departmentHeadcount.min,
        max: filters.departmentHeadcount.max,
      };
    }
    if (filters.fortuneRanking !== undefined) {
      apiFilters['fortune_ranking'] = filters.fortuneRanking;
    }
    if (filters.isHiring !== undefined) {
      apiFilters['is_hiring'] = filters.isHiring;
    }
    if (filters.recentlyFunded !== undefined) {
      apiFilters['recently_funded'] = filters.recentlyFunded;
    }
    if (filters.hasJobOpenings !== undefined) {
      apiFilters['has_job_openings'] = filters.hasJobOpenings;
    }

    return apiFilters;
  }

  /**
   * Builds people search filters in API format.
   */
  private buildPeopleFilters(filters: PeopleSearchRequest['filters']): Record<string, unknown> {
    const apiFilters: Record<string, unknown> = {};

    if (filters.keywords !== undefined) {
      apiFilters['keywords'] = filters.keywords;
    }
    if (filters.titles !== undefined) {
      apiFilters['titles'] = filters.titles;
    }
    if (filters.seniorityLevels !== undefined) {
      apiFilters['seniority_levels'] = filters.seniorityLevels;
    }
    if (filters.functions !== undefined) {
      apiFilters['functions'] = filters.functions;
    }
    if (filters.companies !== undefined) {
      apiFilters['companies'] = filters.companies;
    }
    if (filters.companyUrns !== undefined) {
      apiFilters['company_urns'] = filters.companyUrns;
    }
    if (filters.industries !== undefined) {
      apiFilters['industries'] = filters.industries;
    }
    if (filters.locations !== undefined) {
      apiFilters['locations'] = filters.locations;
    }
    if (filters.schools !== undefined) {
      apiFilters['schools'] = filters.schools;
    }
    if (filters.yearsOfExperience !== undefined) {
      apiFilters['years_of_experience'] = {
        min: filters.yearsOfExperience.min,
        max: filters.yearsOfExperience.max,
      };
    }
    if (filters.yearsInCurrentPosition !== undefined) {
      apiFilters['years_in_current_position'] = {
        min: filters.yearsInCurrentPosition.min,
        max: filters.yearsInCurrentPosition.max,
      };
    }
    if (filters.yearsAtCurrentCompany !== undefined) {
      apiFilters['years_at_current_company'] = {
        min: filters.yearsAtCurrentCompany.min,
        max: filters.yearsAtCurrentCompany.max,
      };
    }
    if (filters.connectionDegree !== undefined) {
      apiFilters['connection_degree'] = filters.connectionDegree;
    }
    if (filters.changedJobsRecently !== undefined) {
      apiFilters['changed_jobs_recently'] = filters.changedJobsRecently;
    }
    if (filters.postedRecently !== undefined) {
      apiFilters['posted_recently'] = filters.postedRecently;
    }
    if (filters.profileLanguage !== undefined) {
      apiFilters['profile_language'] = filters.profileLanguage;
    }

    return apiFilters;
  }
}
