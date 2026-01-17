import type { PaginationOptions } from './common.interface.js';

/**
 * LinkedIn company profile.
 */
export interface LinkedInCompany {
  /** Company URN identifier */
  urn: string;

  /** Company name */
  name: string;

  /** Company industry */
  industry?: string;

  /** Company description */
  description?: string;

  /** Company logo URL */
  logoUrl?: string;

  /** Company website URL */
  websiteUrl?: string;

  /** Company LinkedIn URL */
  linkedinUrl?: string;

  /** Headquarters location */
  headquarters?: LinkedInLocation;

  /** Company size/headcount range */
  employeeCountRange?: string;

  /** Exact employee count (if available) */
  employeeCount?: number;

  /** Company founded year */
  foundedYear?: number;

  /** Company specialties */
  specialties?: string[];

  /** Company type (public, private, etc.) */
  companyType?: string;

  /** Annual revenue range */
  revenueRange?: string;
}

/**
 * LinkedIn person/lead profile.
 */
export interface LinkedInPerson {
  /** Person URN identifier */
  urn: string;

  /** First name */
  firstName: string;

  /** Last name */
  lastName: string;

  /** Full display name */
  fullName: string;

  /** Profile headline */
  headline?: string;

  /** Profile summary */
  summary?: string;

  /** Profile picture URL */
  pictureUrl?: string;

  /** LinkedIn profile URL */
  linkedinUrl?: string;

  /** Current position */
  currentPosition?: LinkedInPosition;

  /** Current company */
  currentCompany?: LinkedInCompany;

  /** Location */
  location?: LinkedInLocation;

  /** Industry */
  industry?: string;

  /** Connection degree (1st, 2nd, 3rd) */
  connectionDegree?: number;

  /** Email address (if available) */
  email?: string;

  /** Phone number (if available) */
  phone?: string;

  /** Work experience */
  experience?: LinkedInPosition[];

  /** Education */
  education?: LinkedInEducation[];

  /** Skills */
  skills?: string[];
}

/**
 * LinkedIn position/job.
 */
export interface LinkedInPosition {
  /** Position title */
  title: string;

  /** Company name */
  companyName: string;

  /** Company URN */
  companyUrn?: string;

  /** Start date */
  startDate?: string;

  /** End date (null if current) */
  endDate?: string;

  /** Is current position */
  isCurrent: boolean;

  /** Position description */
  description?: string;

  /** Location */
  location?: string;
}

/**
 * LinkedIn education entry.
 */
export interface LinkedInEducation {
  /** School name */
  schoolName: string;

  /** Degree name */
  degree?: string;

  /** Field of study */
  fieldOfStudy?: string;

  /** Start year */
  startYear?: number;

  /** End year */
  endYear?: number;

  /** Description */
  description?: string;
}

/**
 * LinkedIn location.
 */
export interface LinkedInLocation {
  /** City */
  city?: string;

  /** State/region */
  region?: string;

  /** Country */
  country?: string;

  /** Country code */
  countryCode?: string;

  /** Full formatted location string */
  formatted?: string;
}

/**
 * LinkedIn Sales Navigator company search filters.
 */
export interface CompanySearchFilters {
  /** Company name keywords */
  keywords?: string;

  /** Industries */
  industries?: string[];

  /** Headquarters locations */
  locations?: string[];

  /** Employee count range */
  employeeCountRange?: {
    min?: number;
    max?: number;
  };

  /** Annual revenue range */
  revenueRange?: {
    min?: number;
    max?: number;
  };

  /** Company growth rate */
  growthRate?: string;

  /** Technologies used */
  technologies?: string[];

  /** Department headcount */
  departmentHeadcount?: {
    department: string;
    min?: number;
    max?: number;
  };

  /** Fortune ranking */
  fortuneRanking?: string;

  /** Hiring status */
  isHiring?: boolean;

  /** Recently funded */
  recentlyFunded?: boolean;

  /** Job opportunities */
  hasJobOpenings?: boolean;
}

/**
 * LinkedIn Sales Navigator people search filters.
 */
export interface PeopleSearchFilters {
  /** Name or keywords */
  keywords?: string;

  /** Job titles */
  titles?: string[];

  /** Seniority levels */
  seniorityLevels?: string[];

  /** Job functions */
  functions?: string[];

  /** Company names */
  companies?: string[];

  /** Company URNs */
  companyUrns?: string[];

  /** Industries */
  industries?: string[];

  /** Locations */
  locations?: string[];

  /** Schools attended */
  schools?: string[];

  /** Years of experience */
  yearsOfExperience?: {
    min?: number;
    max?: number;
  };

  /** Years in current position */
  yearsInCurrentPosition?: {
    min?: number;
    max?: number;
  };

  /** Years at current company */
  yearsAtCurrentCompany?: {
    min?: number;
    max?: number;
  };

  /** Connection degree (1, 2, 3) */
  connectionDegree?: number[];

  /** Has changed jobs recently */
  changedJobsRecently?: boolean;

  /** Posted on LinkedIn recently */
  postedRecently?: boolean;

  /** Profile language */
  profileLanguage?: string;
}

/**
 * Company search request.
 */
export interface CompanySearchRequest extends PaginationOptions {
  /** Account ID (LinkedIn with Sales Navigator) */
  accountId: string;

  /** Search filters */
  filters: CompanySearchFilters;
}

/**
 * People search request.
 */
export interface PeopleSearchRequest extends PaginationOptions {
  /** Account ID (LinkedIn with Sales Navigator) */
  accountId: string;

  /** Search filters */
  filters: PeopleSearchFilters;
}

/**
 * Company search result.
 */
export interface CompanySearchResult {
  /** Companies matching search */
  companies: LinkedInCompany[];

  /** Total results count */
  totalCount: number;

  /** Pagination cursor */
  cursor?: string;
}

/**
 * People search result.
 */
export interface PeopleSearchResult {
  /** People matching search */
  people: LinkedInPerson[];

  /** Total results count */
  totalCount: number;

  /** Pagination cursor */
  cursor?: string;
}

/**
 * Search parameter enumeration value.
 */
export interface SearchParameterValue {
  /** Parameter value ID */
  id: string;

  /** Display name */
  name: string;

  /** Parent ID (for hierarchical values) */
  parentId?: string;
}

/**
 * Search parameter type.
 */
export type SearchParameterType =
  | 'industry'
  | 'location'
  | 'company_size'
  | 'seniority'
  | 'function'
  | 'revenue_range'
  | 'technology';

/**
 * Get search parameters request.
 */
export interface GetSearchParametersRequest {
  /** Account ID */
  accountId: string;

  /** Parameter type */
  type: SearchParameterType;

  /** Search query (for filtering values) */
  query?: string;
}

/**
 * Company enrichment request.
 */
export interface EnrichCompanyRequest {
  /** Account ID */
  accountId: string;

  /** Company URN or LinkedIn URL */
  companyIdentifier: string;
}

/**
 * Person enrichment request.
 */
export interface EnrichPersonRequest {
  /** Account ID */
  accountId: string;

  /** Person URN or LinkedIn URL */
  personIdentifier: string;
}
