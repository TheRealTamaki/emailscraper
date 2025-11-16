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
 * Configuration for the scraper
 */
export interface ScraperConfig {
  firecrawlApiKey: string;
  verbose?: boolean;
}

/**
 * Result from scraping operation
 */
export interface ScrapeResult {
  success: boolean;
  contacts: ContactInfo[];
  errors: string[];
}
