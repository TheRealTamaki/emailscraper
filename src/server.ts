import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { EmailScraper } from './scraper';
import { ScrapeResult, ScraperConfig } from './types';
import { getPresetConfig, PresetType, mergeWithDefaults } from './config-presets';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Types for API requests
interface ScrapeRequest {
  apiKey: string;
  url: string;
  mode: 'direct' | 'profiles';
  preset?: PresetType;
  customConfig?: Partial<ScraperConfig>;
}

// API Routes
app.post('/api/scrape', async (req: Request, res: Response) => {
  try {
    const { apiKey, url, mode, preset, customConfig }: ScrapeRequest = req.body;

    // Validate input
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!mode || (mode !== 'direct' && mode !== 'profiles')) {
      return res.status(400).json({ error: 'Invalid mode. Must be "direct" or "profiles"' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Create scraper configuration
    let config: ScraperConfig;

    if (customConfig) {
      // Use custom configuration merged with defaults
      config = mergeWithDefaults(apiKey, { ...customConfig, verbose: false });
    } else if (preset) {
      // Use preset configuration
      config = getPresetConfig(preset, apiKey, false);
    } else {
      // Use default configuration
      config = getPresetConfig('default', apiKey, false);
    }

    // Create scraper instance with configuration
    const scraper = new EmailScraper(config);

    let result: ScrapeResult;

    // Execute scraping based on mode
    if (mode === 'direct') {
      // Scenario 1: Scrape emails directly from the page
      result = await scraper.scrapeDirectPage(url);
    } else {
      // Scenario 2: Scrape team page then access profile pages
      result = await scraper.scrape(url);
    }

    // Return results
    return res.json(result);

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      error: 'An error occurred during scraping',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend available at http://localhost:${PORT}`);
  }
});
