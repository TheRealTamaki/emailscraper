# Email Scraper

A professional, configurable email scraper with a modern web GUI, built with the Firecrawl API to extract contact information (name, email, job title) from web pages. **Now supports any business type** with customizable configuration presets!

## Features

- **Modern Web GUI**: Clean and professional interface for easy scraping
- **Two Scraping Modes**:
  - **Direct Page Scraping**: Extract all emails directly from a single page
  - **Profile Page Scraping**: Discover team member profiles and scrape each individually
- **Business-Agnostic Configuration**: Pre-built presets for different industries (real estate, corporate, law firms, consulting)
- **Fully Customizable**: Override any configuration setting to match your specific needs
- **API Key Input**: Securely enter your Firecrawl API key through the interface
- **Export Options**: Download results as JSON or CSV
- **Real-time Results**: View scraped contacts in a beautiful table
- **Built with Modern Tech**: React, TypeScript, Express, and Tailwind CSS

## Prerequisites

- Node.js 18+ installed
- A Firecrawl API key (get one at [firecrawl.dev](https://firecrawl.dev))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd emailscraper
```

2. Install all dependencies (server and client):
```bash
npm install
cd client && npm install && cd ..
```

Or use the convenience script:
```bash
npm run install:all
```

## Usage

### Web GUI (Recommended)

The easiest way to use the scraper is through the web interface:

1. **Start the development server**:
```bash
npm run dev
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend React app on `http://localhost:3000`

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Enter your Firecrawl API key** in the first field (get one at [firecrawl.dev](https://firecrawl.dev))

4. **Choose a scraping mode**:
   - **Direct Page Scraping**: For pages with all contact info on a single page
   - **Profile Page Scraping**: For team pages with links to individual profiles

5. **Select a configuration preset** (optional):
   - **Default**: General-purpose configuration for most websites
   - **Real Estate**: Optimized for real estate websites (Ray White, RE/MAX, etc.)
   - **Corporate**: Optimized for corporate websites
   - **Consulting**: Optimized for consulting/advisory firms
   - **Law Firm**: Optimized for law firm websites

6. **Enter the target URL** and click "Start Scraping"

7. **View and export results** as JSON or CSV

### CLI Usage (Optional)

You can still use the command-line interface:

```bash
# Scrape a team page
npm run scrape https://example.com/team

# With verbose logging
npm run scrape https://example.com/team --verbose

# Export to file
npm run scrape https://example.com/team --output results.json

# Use a configuration preset
npm run scrape https://raywhite.com/team --preset real-estate
npm run scrape https://lawfirm.com/attorneys --preset law-firm

# Use a custom configuration file
npm run scrape https://example.com/team --config my-config.json
```

Note: For CLI usage, you need to set up a `.env` file with your API key:
```bash
cp .env.example .env
# Edit .env and add: FIRECRAWL_API_KEY=your_api_key_here
```

## How It Works

### Mode 1: Direct Page Scraping

1. Fetches the target page using Firecrawl API
2. Extracts all email addresses from the page content
3. Identifies names and job titles near each email
4. Returns all contacts found on that single page

**Best for**: Contact pages, about pages, or any page with all team members listed together

### Mode 2: Profile Page Scraping

1. **Profile Discovery**: Crawls the team page and finds links to individual profiles (e.g., URLs containing `/team/`, `/profile/`, `/member/`)
2. **Individual Scraping**: For each profile found:
   - Fetches the profile page content using Firecrawl
   - Extracts the person's name (from headers or bold text)
   - Finds email addresses using regex patterns
   - Identifies job titles from common patterns
3. **Results**: Aggregates all contacts into a single table

**Best for**: Team pages with individual profile pages for each member

## Configuration System

The scraper is now fully configurable to work with any business type! You can use **presets** for common industries or create **custom configurations** for specific needs.

### Configuration Presets

Choose from pre-built configurations optimized for different industries:

#### Available Presets

1. **`default`** - General-purpose configuration for most websites
   - Comprehensive URL patterns for various page types
   - Balanced extraction strategies
   - Works well for most team/contact pages

2. **`real-estate`** - Real estate agencies (Ray White, RE/MAX, etc.)
   - Optimized URL patterns: `/agent/`, `/property/`, `/broker/`
   - Tuned for real estate website structures

3. **`corporate`** - Corporate websites
   - Patterns for: `/team/`, `/leadership/`, `/management/`, `/executive/`
   - Suited for business team pages

4. **`consulting`** - Consulting and advisory firms
   - Patterns for: `/consultant/`, `/advisor/`, `/specialist/`, `/expert/`, `/partner/`
   - Optimized for professional services firms

5. **`law-firm`** - Law firms
   - Patterns for: `/attorney/`, `/lawyer/`, `/partner/`
   - Tailored for legal profession websites

### Using Presets

#### In Web GUI
Select your desired preset from the "Configuration Preset" dropdown.

#### In CLI
```bash
npm run scrape https://example.com/team --preset real-estate
```

#### Programmatically
```typescript
import { EmailScraper } from './scraper';
import { getPresetConfig } from './config-presets';

const config = getPresetConfig('real-estate', 'your_api_key', true);
const scraper = new EmailScraper(config);
```

### Custom Configuration

Create a custom configuration file to override any setting:

#### 1. Create a configuration file (`my-config.json`):

```json
{
  "scrapingOptions": {
    "profileUrlPatterns": [
      "/custom-pattern/",
      "/my-team-member/",
      "/staff-profile/"
    ],
    "delayBetweenProfiles": 2000,
    "contextWindowBefore": 1500,
    "contextWindowAfter": 800
  },
  "validationRules": {
    "maxNameLength": 120,
    "maxJobTitleLength": 200
  }
}
```

#### 2. Use your custom configuration:

**CLI:**
```bash
npm run scrape https://example.com/team --config my-config.json
```

**Programmatically:**
```typescript
import { EmailScraper } from './scraper';
import { mergeWithDefaults } from './config-presets';
import * as fs from 'fs';

const customConfig = JSON.parse(fs.readFileSync('my-config.json', 'utf-8'));
const config = mergeWithDefaults('your_api_key', customConfig);
const scraper = new EmailScraper(config);
```

### Configuration Options

#### Profile URL Patterns
Control which URLs are considered profile pages:
```json
{
  "scrapingOptions": {
    "profileUrlPatterns": ["/agent/", "/team/", "/profile/"]
  }
}
```

#### Rate Limiting
Adjust delays between requests:
```json
{
  "scrapingOptions": {
    "delayBetweenProfiles": 1000
  }
}
```

#### Context Windows
Control how much text around emails to analyze:
```json
{
  "scrapingOptions": {
    "contextWindowBefore": 1000,
    "contextWindowAfter": 500
  }
}
```

#### Domain Filtering
Restrict or allow specific domains:
```json
{
  "scrapingOptions": {
    "sameDomainOnly": true,
    "allowedDomains": ["example.com", "subdomain.example.com"],
    "blockedDomains": ["spam.com"]
  }
}
```

#### Validation Rules
Customize data validation:
```json
{
  "validationRules": {
    "maxNameLength": 100,
    "maxJobTitleLength": 150,
    "allowEmailsInNames": false,
    "allowUrlsInNames": false,
    "allowUrlsInTitles": false
  }
}
```

#### Firecrawl Options
Configure Firecrawl behavior:
```json
{
  "scrapingOptions": {
    "firecrawlOptions": {
      "onlyMainContent": true,
      "formats": ["markdown"],
      "timeout": 30000
    }
  }
}
```

For complete configuration options, see `src/types.ts` and `src/config-presets.ts`.

## API Reference

### EmailScraper Class

#### Constructor

```typescript
new EmailScraper(config: ScraperConfig)
```

**Required:**
- `config.firecrawlApiKey` (string): Your Firecrawl API key

**Optional:**
- `config.verbose` (boolean): Enable verbose logging
- `config.emailPattern` (RegExp): Custom email extraction pattern
- `config.namePatterns` (NameExtractionPatterns): Custom name extraction patterns
- `config.jobTitlePatterns` (JobTitleExtractionPatterns): Custom job title patterns
- `config.validationRules` (ValidationRules): Custom validation rules
- `config.scrapingOptions` (ScrapingOptions): Scraping behavior options

See the [Configuration System](#configuration-system) section for details.

#### Methods

##### `scrapeDirectPage(pageUrl: string): Promise<ScrapeResult>`

Scrapes all emails directly from a single page (Mode 1).

##### `scrape(teamPageUrl: string): Promise<ScrapeResult>`

Scrapes a team page and all discovered profile pages (Mode 2).

##### `scrapeSingleProfile(profileUrl: string): Promise<ContactInfo | null>`

Scrapes a single profile URL directly.

##### `scrapeProfiles(profileUrls: string[]): Promise<ScrapeResult>`

Scrapes multiple profile URLs when you already have the profile links.

### Types

#### ContactInfo

```typescript
interface ContactInfo {
  name: string;
  email: string;
  jobTitle: string;
  profileUrl: string;
}
```

#### ScrapeResult

```typescript
interface ScrapeResult {
  success: boolean;
  contacts: ContactInfo[];
  errors: string[];
}
```

## Building for Production

1. Build both server and client:
```bash
npm run build
```

This compiles:
- TypeScript server code to `dist/`
- React frontend to `client/dist/`

2. Start the production server:
```bash
NODE_ENV=production npm start
```

The server will serve the built React app and API on port 3001.

## Programmatic Usage

You can also use the scraper in your own Node.js code:

### Basic Usage

```typescript
import { EmailScraper } from './scraper';

const scraper = new EmailScraper({
  firecrawlApiKey: 'your_api_key',
  verbose: true
});

const result = await scraper.scrape('https://example.com/team');
console.log(result.contacts);
```

### With Configuration Presets

```typescript
import { EmailScraper } from './scraper';
import { getPresetConfig } from './config-presets';

// Use a preset
const config = getPresetConfig('real-estate', 'your_api_key', true);
const scraper = new EmailScraper(config);

const result = await scraper.scrape('https://raywhite.com/team');
console.log(result.contacts);
```

### With Custom Configuration

```typescript
import { EmailScraper } from './scraper';
import { mergeWithDefaults } from './config-presets';

// Custom configuration merged with defaults
const config = mergeWithDefaults('your_api_key', {
  verbose: true,
  scrapingOptions: {
    profileUrlPatterns: ['/my-custom-pattern/'],
    delayBetweenProfiles: 2000
  },
  validationRules: {
    maxNameLength: 120
  }
});

const scraper = new EmailScraper(config);
const result = await scraper.scrape('https://example.com/team');
console.log(result.contacts);
```

## Troubleshooting

### No profiles found

- Check if the team page URL is correct
- Try a different configuration preset that matches your target website type
- The profile URL patterns might not match your target site
  - Use `--verbose` flag to see which links were discovered
  - Create a custom configuration with appropriate `profileUrlPatterns`
- Example fix:
  ```bash
  npm run scrape https://example.com/team --preset corporate --verbose
  ```

### Missing data fields

- The website structure might be different from expected
- Try adjusting validation rules in a custom configuration
- Some profiles might not have all fields (email, job title, etc.)
- Example: Increase max lengths if titles are being truncated:
  ```json
  {
    "validationRules": {
      "maxNameLength": 150,
      "maxJobTitleLength": 200
    }
  }
  ```

### Rate limiting

- The scraper includes a 1-second delay between profile requests by default
- Adjust the delay in your configuration if needed:
  ```json
  {
    "scrapingOptions": {
      "delayBetweenProfiles": 2000
    }
  }
  ```
- Note: Firecrawl has rate limits based on your plan

### Wrong industry/website type

- Make sure you're using the appropriate preset for your target website
- Real estate site? Use `--preset real-estate`
- Law firm? Use `--preset law-firm`
- Not matching any preset? Use `--preset default` or create a custom configuration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
