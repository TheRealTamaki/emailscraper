/**
 * Represents contact information extracted from a team member profile
 */
export interface ContactInfo {
  name: string;
  email: string;
  jobTitle: string;
  profileUrl: string;
}

/**
 * Pattern definitions for extracting names from content
 */
export interface NameExtractionPatterns {
  h1Pattern?: RegExp;           // Pattern for H1 headers (e.g., /^#\s+(.+?)$/m)
  headerPattern?: RegExp;        // Pattern for any header
  boldPattern?: RegExp;          // Pattern for bold text
  lineBeforePattern?: RegExp;    // Pattern for text immediately before email
}

/**
 * Pattern definitions for extracting job titles from content
 */
export interface JobTitleExtractionPatterns {
  h2Pattern?: RegExp;            // Pattern for H2 headers
  labelPatterns?: RegExp[];      // Patterns for explicit labels (e.g., "Title: CEO")
  italicPattern?: RegExp;        // Pattern for italic text
  lineAfterPattern?: RegExp;     // Pattern for text after name/email
}

/**
 * Validation rules for extracted data
 */
export interface ValidationRules {
  maxNameLength?: number;        // Maximum length for names (default: 100)
  maxJobTitleLength?: number;    // Maximum length for job titles (default: 150)
  allowEmailsInNames?: boolean;  // Allow @ symbols in names (default: false)
  allowUrlsInNames?: boolean;    // Allow URLs in names (default: false)
  allowUrlsInTitles?: boolean;   // Allow URLs in job titles (default: false)
}

/**
 * Options for scraping behavior
 */
export interface ScrapingOptions {
  // Profile URL detection patterns
  profileUrlPatterns?: string[];

  // Rate limiting
  delayBetweenProfiles?: number; // Milliseconds to wait between profile requests (default: 1000)

  // Context windows for direct page scraping
  contextWindowBefore?: number;  // Characters to look before email (default: 1000)
  contextWindowAfter?: number;   // Characters to look after email (default: 500)

  // Firecrawl options
  firecrawlOptions?: {
    onlyMainContent?: boolean;   // Extract only main content (default: true)
    formats?: string[];          // Formats to extract (default: ['markdown'])
    timeout?: number;            // Request timeout in milliseconds
  };

  // Domain filtering
  sameDomainOnly?: boolean;      // Only scrape links from same domain (default: true)
  allowedDomains?: string[];     // Whitelist of allowed domains (empty = all allowed)
  blockedDomains?: string[];     // Blacklist of blocked domains
}

/**
 * Configuration for the email scraper
 */
export interface ScraperConfig {
  firecrawlApiKey: string;
  verbose?: boolean;

  // Pattern for extracting emails
  emailPattern?: RegExp;

  // Patterns for extracting names and job titles
  namePatterns?: NameExtractionPatterns;
  jobTitlePatterns?: JobTitleExtractionPatterns;

  // Validation rules
  validationRules?: ValidationRules;

  // Scraping behavior options
  scrapingOptions?: ScrapingOptions;
}

/**
 * Result from scraping operation
 */
export interface ScrapeResult {
  success: boolean;
  contacts: ContactInfo[];
  errors: string[];
}
