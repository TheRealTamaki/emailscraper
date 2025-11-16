# Email Scraper

A professional email scraper with a modern web GUI, built with the Firecrawl API to extract contact information (name, email, job title) from web pages.

## Features

- **Modern Web GUI**: Clean and professional interface for easy scraping
- **Two Scraping Modes**:
  - **Direct Page Scraping**: Extract all emails directly from a single page
  - **Profile Page Scraping**: Discover team member profiles and scrape each individually
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

5. **Enter the target URL** and click "Start Scraping"

6. **View and export results** as JSON or CSV

### CLI Usage (Optional)

You can still use the command-line interface:

```bash
# Scrape a team page
npm run scrape https://example.com/team

# With verbose logging
npm run scrape https://example.com/team --verbose

# Export to file
npm run scrape https://example.com/team --output results.json
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

## Customization

### Adjusting Profile URL Patterns

If your target website uses different URL patterns for profiles, modify the `extractProfileUrls` method in `src/scraper.ts`:

```typescript
const profileUrls = links.filter((link: string) => {
  return (
    link.includes('/your-custom-pattern/') ||
    link.includes('/another-pattern/')
  );
});
```

### Customizing Data Extraction

The extraction logic in `extractContactInfo` method can be customized to match your specific website structure. Modify the regex patterns to better match your target pages.

## API Reference

### EmailScraper Class

#### Constructor

```typescript
new EmailScraper(config: ScraperConfig)
```

- `config.firecrawlApiKey` (string, required): Your Firecrawl API key
- `config.verbose` (boolean, optional): Enable verbose logging

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

```typescript
import { EmailScraper } from './scraper';

const scraper = new EmailScraper({
  firecrawlApiKey: 'your_api_key',
  verbose: true
});

const result = await scraper.scrape('https://example.com/team');

console.log(result.contacts);
```

## Troubleshooting

### No profiles found

- Check if the team page URL is correct
- The default profile URL patterns might not match your target site
- Use `--verbose` flag to see which links were discovered
- Customize the profile URL patterns in `src/scraper.ts`

### Missing data fields

- The website structure might be different from expected
- Customize the regex patterns in the `extractContactInfo` method
- Some profiles might not have all fields (email, job title, etc.)

### Rate limiting

- The scraper includes a 1-second delay between profile requests
- If you need to adjust this, modify the delay in the scraper loop
- Firecrawl has rate limits based on your plan

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
