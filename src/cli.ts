#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EmailScraper } from './scraper';
import { getPresetConfig, PresetType, mergeWithDefaults } from './config-presets';
import { ScraperConfig } from './types';

// Load environment variables
dotenv.config();

async function main() {
  const args = process.argv.slice(2);

  // Display help if no arguments or --help flag
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    displayHelp();
    return;
  }

  // Get API key from environment
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('Error: FIRECRAWL_API_KEY not found in environment variables.');
    console.error('Please create a .env file with your Firecrawl API key.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }

  // Parse command line arguments
  const verbose = args.includes('--verbose') || args.includes('-v');
  const outputFile = getArgValue(args, '--output', '-o');
  const preset = getArgValue(args, '--preset', '-p') as PresetType || 'default';
  const configFile = getArgValue(args, '--config', '-c');

  // Get the URL (first non-flag argument)
  const url = args.find(arg => !arg.startsWith('-'));

  if (!url) {
    console.error('Error: Please provide a URL to scrape.');
    displayHelp();
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error(`Error: Invalid URL: ${url}`);
    process.exit(1);
  }

  // Create scraper configuration
  let config: ScraperConfig;

  if (configFile) {
    // Load custom configuration from file
    try {
      const configPath = path.resolve(process.cwd(), configFile);
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const customConfig = JSON.parse(configContent);
      config = mergeWithDefaults(apiKey, { ...customConfig, verbose });
      console.log(`Using custom configuration from: ${configFile}`);
    } catch (error) {
      console.error(`Error loading config file: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  } else {
    // Use preset configuration
    config = getPresetConfig(preset, apiKey, verbose);
    if (preset !== 'default') {
      console.log(`Using preset: ${preset}`);
    }
  }

  // Create scraper instance with configuration
  const scraper = new EmailScraper(config);

  console.log('Starting email scraper...');
  console.log(`Target URL: ${url}\n`);

  try {
    // Scrape the team page
    const result = await scraper.scrape(url);

    // Display results
    if (result.success && result.contacts.length > 0) {
      console.log(`\n✓ Successfully scraped ${result.contacts.length} contacts:\n`);

      result.contacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name}`);
        console.log(`   Email: ${contact.email}`);
        console.log(`   Job Title: ${contact.jobTitle || 'N/A'}`);
        console.log(`   Profile URL: ${contact.profileUrl}`);
        console.log('');
      });

      // Save to file if output flag is provided
      if (outputFile) {
        saveToFile(result.contacts, outputFile);
      }
    } else {
      console.log('\n✗ No contacts found.');
    }

    // Display errors if any
    if (result.errors.length > 0) {
      console.log(`\nWarnings/Errors (${result.errors.length}):`);
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error(`\nFatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function getArgValue(args: string[], longFlag: string, shortFlag?: string): string | null {
  const longIndex = args.indexOf(longFlag);
  const shortIndex = shortFlag ? args.indexOf(shortFlag) : -1;

  const index = longIndex !== -1 ? longIndex : shortIndex;

  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }

  return null;
}

function saveToFile(contacts: any[], filename: string) {
  try {
    const outputPath = path.resolve(process.cwd(), filename);

    // Determine file format based on extension
    const ext = path.extname(filename).toLowerCase();

    let content: string;

    if (ext === '.json') {
      content = JSON.stringify(contacts, null, 2);
    } else if (ext === '.csv') {
      // CSV format
      const headers = 'Name,Email,Job Title,Profile URL\n';
      const rows = contacts.map(c =>
        `"${c.name}","${c.email}","${c.jobTitle || ''}","${c.profileUrl}"`
      ).join('\n');
      content = headers + rows;
    } else {
      // Default to JSON
      content = JSON.stringify(contacts, null, 2);
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`\n✓ Results saved to: ${outputPath}`);
  } catch (error) {
    console.error(`\n✗ Error saving file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function displayHelp() {
  console.log(`
Email Scraper - Extract contact information from team profile pages

Usage:
  npm run scrape <url> [options]

Arguments:
  <url>                    URL of the team page to scrape

Options:
  -v, --verbose            Enable verbose logging
  -o, --output <file>      Save results to a file (supports .json and .csv)
  -p, --preset <type>      Use a configuration preset (default, real-estate, corporate, consulting, law-firm)
  -c, --config <file>      Load custom configuration from JSON file
  -h, --help               Display this help message

Configuration Presets:
  default                  General-purpose configuration for most websites
  real-estate              Optimized for real estate websites (Ray White, RE/MAX, etc.)
  corporate                Optimized for corporate websites
  consulting               Optimized for consulting/advisory firms
  law-firm                 Optimized for law firm websites

Examples:
  npm run scrape https://example.com/team
  npm run scrape https://example.com/team --verbose
  npm run scrape https://example.com/team --output results.json
  npm run scrape https://example.com/team -o results.csv -v
  npm run scrape https://raywhite.com/team --preset real-estate
  npm run scrape https://lawfirm.com/attorneys --preset law-firm
  npm run scrape https://example.com/team --config my-config.json

Environment Variables:
  FIRECRAWL_API_KEY       Your Firecrawl API key (required)
                          Get one at https://firecrawl.dev

Setup:
  1. Copy .env.example to .env
  2. Add your Firecrawl API key to .env
  3. Run: npm run scrape <url>

Custom Configuration:
  You can create a custom configuration JSON file to override default settings.
  See the documentation for available configuration options.
`);
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
