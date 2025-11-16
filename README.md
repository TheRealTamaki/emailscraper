# Email Scraper

A powerful email scraper built with the Firecrawl API to extract contact information (name, email, job title) from team profile pages.

## Features

- Scrapes team pages and automatically discovers individual profile links
- Extracts name, email address, and job title from each profile
- Supports exporting results to JSON or CSV format
- Verbose logging option for debugging
- Rate limiting to respect server resources
- Built with TypeScript for type safety

## Prerequisites

- Node.js 18+ installed
- A Firecrawl API key (get one at [firecrawl.dev](https://firecrawl.dev))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd emailscraper
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Firecrawl API key:
```
FIRECRAWL_API_KEY=your_api_key_here
```

## Usage

### Basic Usage

Scrape a team page and display results in the console:

```bash
npm run scrape https://example.com/team
```

### With Verbose Logging

Get detailed information about the scraping process:

```bash
npm run scrape https://example.com/team --verbose
```

### Export to File

Save results to a JSON file:

```bash
npm run scrape https://example.com/team --output results.json
```

Save results to a CSV file:

```bash
npm run scrape https://example.com/team --output contacts.csv
```

### Combined Options

```bash
npm run scrape https://example.com/team --verbose --output results.json
```

## How It Works

1. **Profile Discovery**: The scraper first crawls the main team page URL you provide and looks for links that match common profile URL patterns (e.g., `/team/`, `/profile/`, `/member/`, `/people/`, `/staff/`).

2. **Data Extraction**: For each discovered profile URL, the scraper:
   - Fetches the page content using Firecrawl
   - Extracts the person's name (from headers or bold text)
   - Finds email addresses using regex patterns
   - Identifies job titles from common patterns

3. **Results**: The scraped data is displayed in the console and optionally saved to a file.

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

##### `scrape(teamPageUrl: string): Promise<ScrapeResult>`

Scrapes a team page and all discovered profile pages.

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

Compile TypeScript to JavaScript:

```bash
npm run build
```

Run the compiled version:

```bash
npm start <url> [options]
```

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
