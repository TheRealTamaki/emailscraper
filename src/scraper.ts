import FirecrawlApp from '@mendable/firecrawl-js';
import { ContactInfo, ScraperConfig, ScrapeResult } from './types';

export class EmailScraper {
  private firecrawl: FirecrawlApp;
  private verbose: boolean;

  constructor(config: ScraperConfig) {
    this.firecrawl = new FirecrawlApp({ apiKey: config.firecrawlApiKey });
    this.verbose = config.verbose || false;
  }

  /**
   * Logs a message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[EmailScraper] ${message}`);
    }
  }

  /**
   * Extracts profile URLs from the main team page
   */
  private async extractProfileUrls(teamPageUrl: string): Promise<string[]> {
    this.log(`Scraping team page: ${teamPageUrl}`);

    try {
      const result = await this.firecrawl.scrapeUrl(teamPageUrl, {
        formats: ['markdown', 'links']
      });

      if (!result.success) {
        throw new Error('Failed to scrape team page');
      }

      // Extract all links from the page
      const links = result.links || [];
      this.log(`Found ${links.length} links on the team page`);

      // Filter links that are likely profile pages
      // This is a heuristic - adjust based on your specific site structure
      const profileUrls = links.filter((link: string) => {
        // Common patterns for profile URLs
        return (
          link.includes('/team/') ||
          link.includes('/profile/') ||
          link.includes('/member/') ||
          link.includes('/people/') ||
          link.includes('/staff/')
        );
      });

      this.log(`Identified ${profileUrls.length} potential profile URLs`);
      return profileUrls;
    } catch (error) {
      throw new Error(`Error extracting profile URLs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extracts contact information from a single profile page
   */
  private async extractContactInfo(profileUrl: string): Promise<ContactInfo | null> {
    this.log(`Scraping profile: ${profileUrl}`);

    try {
      const result = await this.firecrawl.scrapeUrl(profileUrl, {
        formats: ['markdown'],
        onlyMainContent: true
      });

      if (!result.success || !result.markdown) {
        this.log(`Failed to scrape profile: ${profileUrl}`);
        return null;
      }

      const content = result.markdown;

      // Extract email using regex
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emailMatches = content.match(emailRegex);
      const email = emailMatches ? emailMatches[0] : '';

      if (!email) {
        this.log(`No email found on profile: ${profileUrl}`);
        return null;
      }

      // Extract name - typically in headers or first prominent text
      const nameRegex = /^#\s+(.+)$/m;
      const nameMatch = content.match(nameRegex);
      let name = nameMatch ? nameMatch[1].trim() : '';

      // If no header found, try to find name near the email or in bold text
      if (!name) {
        const boldTextRegex = /\*\*(.+?)\*\*/g;
        const boldMatches = [...content.matchAll(boldTextRegex)];
        if (boldMatches.length > 0) {
          name = boldMatches[0][1].trim();
        }
      }

      // Extract job title - common patterns
      const jobTitlePatterns = [
        /(?:title|position|role):\s*(.+?)(?:\n|$)/gi,
        /##\s+(.+?)(?:\n|$)/,
        /\*\*(.+?)\*\*\s*(?:\n|$)/
      ];

      let jobTitle = '';
      for (const pattern of jobTitlePatterns) {
        const match = content.match(pattern);
        if (match && match[1] && match[1].toLowerCase() !== name.toLowerCase()) {
          jobTitle = match[1].trim();
          break;
        }
      }

      // If we have at least a name and email, return the contact info
      if (name && email) {
        return {
          name,
          email,
          jobTitle,
          profileUrl
        };
      }

      this.log(`Incomplete data on profile: ${profileUrl}`);
      return null;
    } catch (error) {
      this.log(`Error scraping profile ${profileUrl}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Main scraping method - scrapes team page and all profile pages
   */
  public async scrape(teamPageUrl: string): Promise<ScrapeResult> {
    const contacts: ContactInfo[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Extract profile URLs from the team page
      let profileUrls: string[];

      try {
        profileUrls = await this.extractProfileUrls(teamPageUrl);
      } catch (error) {
        errors.push(`Failed to extract profile URLs: ${error instanceof Error ? error.message : String(error)}`);
        return { success: false, contacts: [], errors };
      }

      if (profileUrls.length === 0) {
        errors.push('No profile URLs found on the team page');
        return { success: false, contacts: [], errors };
      }

      // Step 2: Scrape each profile page
      this.log(`Starting to scrape ${profileUrls.length} profiles...`);

      for (const profileUrl of profileUrls) {
        try {
          const contactInfo = await this.extractContactInfo(profileUrl);

          if (contactInfo) {
            contacts.push(contactInfo);
            this.log(`Successfully extracted: ${contactInfo.name} <${contactInfo.email}>`);
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          const errorMsg = `Error scraping ${profileUrl}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.log(errorMsg);
        }
      }

      this.log(`Scraping complete. Found ${contacts.length} contacts.`);

      return {
        success: contacts.length > 0,
        contacts,
        errors
      };
    } catch (error) {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, contacts: [], errors };
    }
  }

  /**
   * Scrape a single profile URL directly
   */
  public async scrapeSingleProfile(profileUrl: string): Promise<ContactInfo | null> {
    return this.extractContactInfo(profileUrl);
  }

  /**
   * Scrape multiple profile URLs directly (when you already have the profile URLs)
   */
  public async scrapeProfiles(profileUrls: string[]): Promise<ScrapeResult> {
    const contacts: ContactInfo[] = [];
    const errors: string[] = [];

    this.log(`Starting to scrape ${profileUrls.length} profiles...`);

    for (const profileUrl of profileUrls) {
      try {
        const contactInfo = await this.extractContactInfo(profileUrl);

        if (contactInfo) {
          contacts.push(contactInfo);
          this.log(`Successfully extracted: ${contactInfo.name} <${contactInfo.email}>`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMsg = `Error scraping ${profileUrl}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        this.log(errorMsg);
      }
    }

    return {
      success: contacts.length > 0,
      contacts,
      errors
    };
  }
}
