import FirecrawlApp from '@mendable/firecrawl-js';
import { ContactInfo, ScraperConfig, ScrapeResult } from './types';
import { mergeWithDefaults } from './config-presets';

export class EmailScraper {
  private firecrawl: FirecrawlApp;
  private config: ScraperConfig;
  private verbose: boolean;

  constructor(config: ScraperConfig) {
    // Merge provided config with defaults
    this.config = mergeWithDefaults(config.firecrawlApiKey, config);
    this.firecrawl = new FirecrawlApp({ apiKey: this.config.firecrawlApiKey });
    this.verbose = this.config.verbose || false;
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
      this.log(`Found ${links.length} total links on the team page`);

      // Get the base domain of the team page
      const teamUrl = new URL(teamPageUrl);
      const baseDomain = teamUrl.hostname;

      // Get profile URL patterns from config
      const profileKeywords = this.config.scrapingOptions?.profileUrlPatterns || [];

      // Filter links that are likely profile pages
      const profileUrls = links.filter((link: string) => {
        try {
          const linkUrl = new URL(link);

          // Check domain filtering
          const sameDomainOnly = this.config.scrapingOptions?.sameDomainOnly ?? true;
          if (sameDomainOnly && !linkUrl.hostname.includes(baseDomain.replace('www.', ''))) {
            return false;
          }

          // Check allowed/blocked domains
          const allowedDomains = this.config.scrapingOptions?.allowedDomains || [];
          const blockedDomains = this.config.scrapingOptions?.blockedDomains || [];

          if (allowedDomains.length > 0) {
            const isAllowed = allowedDomains.some(domain => linkUrl.hostname.includes(domain));
            if (!isAllowed) return false;
          }

          if (blockedDomains.length > 0) {
            const isBlocked = blockedDomains.some(domain => linkUrl.hostname.includes(domain));
            if (isBlocked) return false;
          }

          const path = linkUrl.pathname.toLowerCase();

          // Check if the URL contains any profile keywords from config
          return profileKeywords.some(keyword => path.includes(keyword));
        } catch (e) {
          // Invalid URL, skip it
          return false;
        }
      });

      this.log(`Identified ${profileUrls.length} potential profile URLs`);

      // Log a few examples if found
      if (profileUrls.length > 0 && this.verbose) {
        this.log(`Example profile URLs: ${profileUrls.slice(0, 3).join(', ')}`);
      }

      // If no profiles found, log all unique URL patterns to help debug
      if (profileUrls.length === 0 && links.length > 0) {
        const patterns = new Set(
          links
            .map((link: string) => {
              try {
                const url = new URL(link);
                return url.pathname.split('/').filter(p => p).slice(0, 2).join('/');
              } catch {
                return null;
              }
            })
            .filter(Boolean)
        );
        this.log(`No profile URLs found. URL patterns on page: ${Array.from(patterns).slice(0, 10).join(', ')}`);
      }

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
      const firecrawlOptions = this.config.scrapingOptions?.firecrawlOptions || {
        formats: ['markdown'],
        onlyMainContent: true
      };

      const result = await this.firecrawl.scrapeUrl(profileUrl, firecrawlOptions);

      if (!result.success || !result.markdown) {
        this.log(`Failed to scrape profile: ${profileUrl}`);
        return null;
      }

      const content = result.markdown;

      // Extract email using regex from config
      const emailRegex = this.config.emailPattern || /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emailMatches = content.match(emailRegex);
      const email = emailMatches ? emailMatches[0] : '';

      if (!email) {
        this.log(`No email found on profile: ${profileUrl}`);
        return null;
      }

      // Extract name using configured patterns
      let name = '';
      let jobTitle = '';

      const validation = this.config.validationRules || {};
      const maxNameLength = validation.maxNameLength || 100;
      const maxJobTitleLength = validation.maxJobTitleLength || 150;
      const allowEmailsInNames = validation.allowEmailsInNames || false;
      const allowUrlsInNames = validation.allowUrlsInNames || false;
      const allowUrlsInTitles = validation.allowUrlsInTitles || false;

      // Strategy 1 (PRIMARY): Extract name from H1 and job title from text directly underneath
      const h1Pattern = this.config.namePatterns?.h1Pattern || /^#\s+(.+?)$\s*\n+(.+?)$/m;
      const h1Match = content.match(h1Pattern);

      if (h1Match) {
        name = h1Match[1].trim();
        // Get the first line after the H1 as potential job title
        const potentialJobTitle = h1Match[2].trim();

        // Clean up the job title (remove markdown formatting)
        const cleanJobTitle = potentialJobTitle
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '')   // Remove italic
          .replace(/^#+\s*/, '') // Remove any header markers
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Extract link text
          .trim();

        // Validate job title using config rules
        if (cleanJobTitle &&
            cleanJobTitle.toLowerCase() !== name.toLowerCase() &&
            cleanJobTitle.length < maxJobTitleLength &&
            (allowEmailsInNames || !cleanJobTitle.includes('@')) &&
            (allowUrlsInTitles || !cleanJobTitle.toLowerCase().includes('http'))) {
          jobTitle = cleanJobTitle;
        }
      }

      // Strategy 2 (FALLBACK): If no H1 found, look for first header
      if (!name && this.config.namePatterns?.headerPattern) {
        const headerMatch = content.match(this.config.namePatterns.headerPattern);
        if (headerMatch) {
          name = headerMatch[1].trim();
        }
      }

      // Strategy 3 (FALLBACK): Look for bold text near the beginning
      if (!name && this.config.namePatterns?.boldPattern) {
        const boldMatches = [...content.matchAll(this.config.namePatterns.boldPattern)];
        if (boldMatches.length > 0) {
          name = boldMatches[0][1].trim();
        }
      }

      // Additional job title extraction if not found yet
      if (!jobTitle) {
        // Try H2 pattern
        if (this.config.jobTitlePatterns?.h2Pattern) {
          const h2Match = content.match(this.config.jobTitlePatterns.h2Pattern);
          if (h2Match && h2Match[1] && h2Match[1].toLowerCase() !== name.toLowerCase()) {
            jobTitle = h2Match[1].trim();
          }
        }

        // Try label patterns
        if (!jobTitle && this.config.jobTitlePatterns?.labelPatterns) {
          for (const pattern of this.config.jobTitlePatterns.labelPatterns) {
            const match = content.match(pattern);
            if (match && match[1] && match[1].toLowerCase() !== name.toLowerCase()) {
              jobTitle = match[1].trim();
              break;
            }
          }
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

          // Add delay based on config to avoid rate limiting
          const delay = this.config.scrapingOptions?.delayBetweenProfiles || 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
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
   * Scrape emails directly from a single page (Scenario 1)
   * Extracts all emails, names, and job titles found on the page
   */
  public async scrapeDirectPage(pageUrl: string): Promise<ScrapeResult> {
    const contacts: ContactInfo[] = [];
    const errors: string[] = [];

    this.log(`Scraping page directly: ${pageUrl}`);

    try {
      const firecrawlOptions = this.config.scrapingOptions?.firecrawlOptions || {
        formats: ['markdown'],
        onlyMainContent: true
      };

      const result = await this.firecrawl.scrapeUrl(pageUrl, firecrawlOptions);

      if (!result.success || !result.markdown) {
        errors.push('Failed to scrape page');
        return { success: false, contacts: [], errors };
      }

      const content = result.markdown;

      // Extract all emails from the page using config pattern
      const emailRegex = this.config.emailPattern || /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emailMatches = content.match(emailRegex) || [];

      if (emailMatches.length === 0) {
        errors.push('No emails found on page');
        return { success: false, contacts: [], errors };
      }

      // Try to extract context around each email
      const uniqueEmails = [...new Set(emailMatches)];
      this.log(`Found ${uniqueEmails.length} unique emails`);

      const contextWindowBefore = this.config.scrapingOptions?.contextWindowBefore || 1000;
      const contextWindowAfter = this.config.scrapingOptions?.contextWindowAfter || 500;
      const validation = this.config.validationRules || {};
      const maxNameLength = validation.maxNameLength || 100;

      for (const email of uniqueEmails) {
        // Find context around the email with configurable window sizes
        const emailIndex = content.indexOf(email);
        const contextBefore = content.substring(Math.max(0, emailIndex - contextWindowBefore), emailIndex);
        const contextAfter = content.substring(emailIndex + email.length, Math.min(content.length, emailIndex + email.length + contextWindowAfter));
        const fullContext = contextBefore + email + contextAfter;

        // Try to extract name from context
        let name = '';

        // Strategy 1 (PRIMARY): Look for H1 headers - use config pattern
        if (this.config.namePatterns?.h1Pattern) {
          const h1Matches = [...fullContext.matchAll(new RegExp(this.config.namePatterns.h1Pattern.source, 'gm'))];
          if (h1Matches.length > 0) {
            // Get the H1 closest to the email
            const h1 = h1Matches[h1Matches.length - 1][1].trim();
            if (h1.length > 0 && h1.length < maxNameLength && !h1.includes('@')) {
              name = h1;
            }
          }
        }

        // Strategy 2: Look for bold text near the email
        if (!name && this.config.namePatterns?.boldPattern) {
          const boldMatches = [...contextBefore.matchAll(this.config.namePatterns.boldPattern)];
          if (boldMatches.length > 0) {
            const lastBold = boldMatches[boldMatches.length - 1][1].trim();
            if (lastBold.length > 0 && lastBold.length < maxNameLength && !lastBold.includes('@')) {
              name = lastBold;
            }
          }
        }

        // Strategy 3: Look for any header before the email
        if (!name && this.config.namePatterns?.headerPattern) {
          const headerMatches = [...contextBefore.matchAll(new RegExp(this.config.namePatterns.headerPattern.source, 'gm'))];
          if (headerMatches.length > 0) {
            const lastHeader = headerMatches[headerMatches.length - 1][1].trim();
            if (lastHeader.length > 0 && lastHeader.length < maxNameLength && !lastHeader.includes('@')) {
              name = lastHeader;
            }
          }
        }

        // Strategy 4: Look for lines immediately before the email
        if (!name) {
          const linesBefore = contextBefore.split('\n').filter(line => line.trim());
          if (linesBefore.length > 0) {
            // Get the last non-empty line before the email
            const lastLine = linesBefore[linesBefore.length - 1].trim();

            // Remove markdown formatting (headers, bold, links, etc.)
            const cleanLine = lastLine
              .replace(/^#+\s*/, '') // Remove header markers
              .replace(/\*\*/g, '') // Remove bold markers
              .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Extract link text
              .replace(/\*/g, '') // Remove italic markers
              .trim();

            // If the cleaned line doesn't contain email-like patterns and isn't too long, use it as name
            if (cleanLine.length > 0 && cleanLine.length < maxNameLength && !cleanLine.includes('@') && !cleanLine.toLowerCase().includes('email')) {
              name = cleanLine;
            }
          }
        }

        // Try to extract job title using config patterns
        let jobTitle = '';
        const maxJobTitleLength = validation.maxJobTitleLength || 150;

        // Strategy 1 (PRIMARY): Look for H2 headers
        if (this.config.jobTitlePatterns?.h2Pattern) {
          const h2Matches = [...fullContext.matchAll(new RegExp(this.config.jobTitlePatterns.h2Pattern.source, 'gm'))];
          if (h2Matches.length > 0) {
            // Get the H2 closest to the email
            const h2 = h2Matches[h2Matches.length - 1][1].trim();
            if (h2 && h2.toLowerCase() !== name.toLowerCase() && h2.length < maxJobTitleLength && !h2.includes('@')) {
              jobTitle = h2;
            }
          }
        }

        // Strategy 2: Look for explicit labels from config
        if (!jobTitle && this.config.jobTitlePatterns?.labelPatterns) {
          for (const pattern of this.config.jobTitlePatterns.labelPatterns) {
            const match = fullContext.match(pattern);
            if (match && match[1]) {
              const cleanTitle = match[1]
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/^#+\s*/, '')
                .trim();
              if (cleanTitle && cleanTitle.toLowerCase() !== name.toLowerCase() && cleanTitle.length < maxJobTitleLength) {
                jobTitle = cleanTitle;
                break;
              }
            }
          }
        }

        // Strategy 3: Look for italic text near email (sometimes used for titles)
        if (!jobTitle && this.config.jobTitlePatterns?.italicPattern) {
          const italicMatches = [...fullContext.matchAll(this.config.jobTitlePatterns.italicPattern)];
          for (const match of italicMatches) {
            const italic = match[1].trim();
            if (italic && !italic.includes('@') && italic.length > 5 && italic.length < maxJobTitleLength && italic.toLowerCase() !== name.toLowerCase()) {
              jobTitle = italic;
              break;
            }
          }
        }

        // Strategy 4: Look for lines after the email or name
        if (!jobTitle) {
          const linesAfter = contextAfter.split('\n').filter(line => line.trim());
          if (linesAfter.length > 0) {
            const nextLine = linesAfter[0].trim()
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .replace(/^#+\s*/, '')
              .trim();

            if (nextLine && nextLine.length > 5 && nextLine.length < maxJobTitleLength && !nextLine.includes('@') && nextLine.toLowerCase() !== name.toLowerCase()) {
              jobTitle = nextLine;
            }
          }
        }

        contacts.push({
          name: name || 'Unknown',
          email,
          jobTitle: jobTitle || '',
          profileUrl: pageUrl
        });

        this.log(`Extracted: ${name || 'Unknown'} - ${email} - ${jobTitle || 'No title'}`);
      }

      this.log(`Extracted ${contacts.length} contacts from page`);

      return {
        success: contacts.length > 0,
        contacts,
        errors
      };
    } catch (error) {
      errors.push(`Error scraping page: ${error instanceof Error ? error.message : String(error)}`);
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

        // Add delay based on config to avoid rate limiting
        const delay = this.config.scrapingOptions?.delayBetweenProfiles || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
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
