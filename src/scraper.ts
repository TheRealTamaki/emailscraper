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
      this.log(`Found ${links.length} total links on the team page`);

      // Get the base domain of the team page
      const teamUrl = new URL(teamPageUrl);
      const baseDomain = teamUrl.hostname;

      // Filter links that are likely profile pages
      const profileUrls = links.filter((link: string) => {
        try {
          const linkUrl = new URL(link);

          // Only consider links from the same domain
          if (!linkUrl.hostname.includes(baseDomain.replace('www.', ''))) {
            return false;
          }

          const path = linkUrl.pathname.toLowerCase();

          // Common patterns for profile URLs
          return (
            path.includes('/agent/') ||
            path.includes('/agents/') ||
            path.includes('/team/') ||
            path.includes('/teams/') ||
            path.includes('/profile/') ||
            path.includes('/profiles/') ||
            path.includes('/member/') ||
            path.includes('/members/') ||
            path.includes('/people/') ||
            path.includes('/person/') ||
            path.includes('/staff/') ||
            path.includes('/employee/') ||
            path.includes('/our-team/') ||
            path.includes('/our-people/') ||
            path.includes('/our-agents/') ||
            path.includes('/management/') ||
            path.includes('/property/')
          );
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
   * Scrape emails directly from a single page (Scenario 1)
   * Extracts all emails, names, and job titles found on the page
   */
  public async scrapeDirectPage(pageUrl: string): Promise<ScrapeResult> {
    const contacts: ContactInfo[] = [];
    const errors: string[] = [];

    this.log(`Scraping page directly: ${pageUrl}`);

    try {
      const result = await this.firecrawl.scrapeUrl(pageUrl, {
        formats: ['markdown'],
        onlyMainContent: true
      });

      if (!result.success || !result.markdown) {
        errors.push('Failed to scrape page');
        return { success: false, contacts: [], errors };
      }

      const content = result.markdown;

      // Extract all emails from the page
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emailMatches = content.match(emailRegex) || [];

      if (emailMatches.length === 0) {
        errors.push('No emails found on page');
        return { success: false, contacts: [], errors };
      }

      // Try to extract context around each email
      const uniqueEmails = [...new Set(emailMatches)];
      this.log(`Found ${uniqueEmails.length} unique emails`);

      for (const email of uniqueEmails) {
        // Find context around the email with larger window
        const emailIndex = content.indexOf(email);
        const contextBefore = content.substring(Math.max(0, emailIndex - 1000), emailIndex);
        const contextAfter = content.substring(emailIndex + email.length, Math.min(content.length, emailIndex + email.length + 500));
        const fullContext = contextBefore + email + contextAfter;

        // Try to extract name from context
        let name = '';

        // Strategy 1 (PRIMARY): Look for H1 headers (# Name) - most common for person names
        const h1Matches = [...fullContext.matchAll(/^#\s+(.+?)$/gm)];
        if (h1Matches.length > 0) {
          // Get the H1 closest to the email
          const h1 = h1Matches[h1Matches.length - 1][1].trim();
          if (h1.length > 0 && h1.length < 100 && !h1.includes('@')) {
            name = h1;
          }
        }

        // Strategy 2: Look for bold text near the email
        if (!name) {
          const boldMatches = [...contextBefore.matchAll(/\*\*(.+?)\*\*/g)];
          if (boldMatches.length > 0) {
            const lastBold = boldMatches[boldMatches.length - 1][1].trim();
            if (lastBold.length > 0 && lastBold.length < 100 && !lastBold.includes('@')) {
              name = lastBold;
            }
          }
        }

        // Strategy 3: Look for any header before the email
        if (!name) {
          const headerMatches = [...contextBefore.matchAll(/^#+\s+(.+?)$/gm)];
          if (headerMatches.length > 0) {
            const lastHeader = headerMatches[headerMatches.length - 1][1].trim();
            if (lastHeader.length > 0 && lastHeader.length < 100 && !lastHeader.includes('@')) {
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
            if (cleanLine.length > 0 && cleanLine.length < 100 && !cleanLine.includes('@') && !cleanLine.toLowerCase().includes('email')) {
              name = cleanLine;
            }
          }
        }

        // Try to extract job title
        let jobTitle = '';

        // Strategy 1 (PRIMARY): Look for H2 headers (## Job Title) - most common for job titles
        const h2Matches = [...fullContext.matchAll(/^##\s+(.+?)$/gm)];
        if (h2Matches.length > 0) {
          // Get the H2 closest to the email
          const h2 = h2Matches[h2Matches.length - 1][1].trim();
          if (h2 && h2.toLowerCase() !== name.toLowerCase() && h2.length < 100 && !h2.includes('@')) {
            jobTitle = h2;
          }
        }

        // Strategy 2: Look for explicit labels
        if (!jobTitle) {
          const labelPatterns = [
            /(?:title|position|role|job)[\s:]+(.+?)(?:\n|$)/i,
            /(.+?)(?:\s*[-|]\s*)?(?:title|position|role)/i,
          ];

          for (const pattern of labelPatterns) {
            const match = fullContext.match(pattern);
            if (match && match[1]) {
              const cleanTitle = match[1]
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/^#+\s*/, '')
                .trim();
              if (cleanTitle && cleanTitle.toLowerCase() !== name.toLowerCase() && cleanTitle.length < 100) {
                jobTitle = cleanTitle;
                break;
              }
            }
          }
        }

        // Strategy 3: Look for italic text near email (sometimes used for titles)
        if (!jobTitle) {
          const italicMatches = [...fullContext.matchAll(/\*([^*]+?)\*/g)];
          for (const match of italicMatches) {
            const italic = match[1].trim();
            if (italic && !italic.includes('@') && italic.length > 5 && italic.length < 100 && italic.toLowerCase() !== name.toLowerCase()) {
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

            if (nextLine && nextLine.length > 5 && nextLine.length < 100 && !nextLine.includes('@') && nextLine.toLowerCase() !== name.toLowerCase()) {
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
