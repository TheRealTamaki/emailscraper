import {
  ScraperConfig,
  NameExtractionPatterns,
  JobTitleExtractionPatterns,
  ValidationRules,
  ScrapingOptions
} from './types';

/**
 * Default extraction patterns for names
 */
export const DEFAULT_NAME_PATTERNS: NameExtractionPatterns = {
  h1Pattern: /^#\s+(.+?)$/m,
  headerPattern: /^#+\s+(.+)$/m,
  boldPattern: /\*\*(.+?)\*\*/g,
  lineBeforePattern: /(.+?)$/m
};

/**
 * Default extraction patterns for job titles
 */
export const DEFAULT_JOB_TITLE_PATTERNS: JobTitleExtractionPatterns = {
  h2Pattern: /##\s+(.+?)(?:\n|$)/,
  labelPatterns: [
    /(?:title|position|role|job)[\s:]+(.+?)(?:\n|$)/i,
    /(.+?)(?:\s*[-|]\s*)?(?:title|position|role)/i
  ],
  italicPattern: /\*([^*]+?)\*/g,
  lineAfterPattern: /^(.+?)$/m
};

/**
 * Default validation rules
 */
export const DEFAULT_VALIDATION_RULES: ValidationRules = {
  maxNameLength: 100,
  maxJobTitleLength: 150,
  allowEmailsInNames: false,
  allowUrlsInNames: false,
  allowUrlsInTitles: false
};

/**
 * Default scraping options
 */
export const DEFAULT_SCRAPING_OPTIONS: ScrapingOptions = {
  profileUrlPatterns: [
    '/agent/', '/agents/',
    '/team/', '/teams/',
    '/profile/', '/profiles/',
    '/member/', '/members/',
    '/people/', '/person/',
    '/staff/', '/employee/', '/employees/',
    '/our-team/', '/our-people/', '/our-agents/',
    '/management/', '/managers/',
    '/property/', '/properties/',
    '/broker/', '/brokers/',
    '/advisor/', '/advisors/',
    '/consultant/', '/consultants/',
    '/specialist/', '/specialists/',
    '/director/', '/directors/',
    '/executive/', '/executives/',
    '/leadership/',
    '/about-us/team/', '/about/team/'
  ],
  delayBetweenProfiles: 1000,
  contextWindowBefore: 1000,
  contextWindowAfter: 500,
  firecrawlOptions: {
    onlyMainContent: true,
    formats: ['markdown']
  },
  sameDomainOnly: true
};

/**
 * Default email pattern
 */
export const DEFAULT_EMAIL_PATTERN = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

/**
 * Creates a default scraper configuration
 */
export function createDefaultConfig(apiKey: string, verbose: boolean = false): ScraperConfig {
  return {
    firecrawlApiKey: apiKey,
    verbose,
    emailPattern: DEFAULT_EMAIL_PATTERN,
    namePatterns: DEFAULT_NAME_PATTERNS,
    jobTitlePatterns: DEFAULT_JOB_TITLE_PATTERNS,
    validationRules: DEFAULT_VALIDATION_RULES,
    scrapingOptions: DEFAULT_SCRAPING_OPTIONS
  };
}

/**
 * Preset configuration for real estate websites (Ray White, RE/MAX, etc.)
 */
export function createRealEstateConfig(apiKey: string, verbose: boolean = false): ScraperConfig {
  return {
    firecrawlApiKey: apiKey,
    verbose,
    emailPattern: DEFAULT_EMAIL_PATTERN,
    namePatterns: DEFAULT_NAME_PATTERNS,
    jobTitlePatterns: DEFAULT_JOB_TITLE_PATTERNS,
    validationRules: DEFAULT_VALIDATION_RULES,
    scrapingOptions: {
      profileUrlPatterns: [
        '/agent/', '/agents/',
        '/team/', '/teams/',
        '/profile/', '/profiles/',
        '/member/', '/members/',
        '/our-team/', '/our-people/', '/our-agents/',
        '/property/', '/properties/',
        '/broker/', '/brokers/',
        '/specialist/', '/specialists/',
        '/about-us/team/', '/about/team/'
      ],
      delayBetweenProfiles: 1000,
      contextWindowBefore: 1000,
      contextWindowAfter: 500,
      firecrawlOptions: {
        onlyMainContent: true,
        formats: ['markdown']
      },
      sameDomainOnly: true
    }
  };
}

/**
 * Preset configuration for corporate websites
 */
export function createCorporateConfig(apiKey: string, verbose: boolean = false): ScraperConfig {
  return {
    firecrawlApiKey: apiKey,
    verbose,
    emailPattern: DEFAULT_EMAIL_PATTERN,
    namePatterns: DEFAULT_NAME_PATTERNS,
    jobTitlePatterns: DEFAULT_JOB_TITLE_PATTERNS,
    validationRules: DEFAULT_VALIDATION_RULES,
    scrapingOptions: {
      profileUrlPatterns: [
        '/team/', '/teams/',
        '/people/', '/person/',
        '/staff/', '/employee/', '/employees/',
        '/our-team/', '/our-people/',
        '/management/', '/managers/',
        '/director/', '/directors/',
        '/executive/', '/executives/',
        '/leadership/',
        '/about-us/team/', '/about/team/',
        '/about/people/', '/about-us/people/'
      ],
      delayBetweenProfiles: 1000,
      contextWindowBefore: 1000,
      contextWindowAfter: 500,
      firecrawlOptions: {
        onlyMainContent: true,
        formats: ['markdown']
      },
      sameDomainOnly: true
    }
  };
}

/**
 * Preset configuration for consulting/advisory firms
 */
export function createConsultingConfig(apiKey: string, verbose: boolean = false): ScraperConfig {
  return {
    firecrawlApiKey: apiKey,
    verbose,
    emailPattern: DEFAULT_EMAIL_PATTERN,
    namePatterns: DEFAULT_NAME_PATTERNS,
    jobTitlePatterns: DEFAULT_JOB_TITLE_PATTERNS,
    validationRules: DEFAULT_VALIDATION_RULES,
    scrapingOptions: {
      profileUrlPatterns: [
        '/team/', '/teams/',
        '/people/', '/person/',
        '/our-team/', '/our-people/',
        '/advisor/', '/advisors/',
        '/consultant/', '/consultants/',
        '/specialist/', '/specialists/',
        '/expert/', '/experts/',
        '/partner/', '/partners/',
        '/leadership/',
        '/about-us/team/', '/about/team/'
      ],
      delayBetweenProfiles: 1000,
      contextWindowBefore: 1000,
      contextWindowAfter: 500,
      firecrawlOptions: {
        onlyMainContent: true,
        formats: ['markdown']
      },
      sameDomainOnly: true
    }
  };
}

/**
 * Preset configuration for law firms
 */
export function createLawFirmConfig(apiKey: string, verbose: boolean = false): ScraperConfig {
  return {
    firecrawlApiKey: apiKey,
    verbose,
    emailPattern: DEFAULT_EMAIL_PATTERN,
    namePatterns: DEFAULT_NAME_PATTERNS,
    jobTitlePatterns: DEFAULT_JOB_TITLE_PATTERNS,
    validationRules: DEFAULT_VALIDATION_RULES,
    scrapingOptions: {
      profileUrlPatterns: [
        '/attorney/', '/attorneys/',
        '/lawyer/', '/lawyers/',
        '/partner/', '/partners/',
        '/team/', '/teams/',
        '/people/', '/person/',
        '/our-team/', '/our-people/',
        '/our-attorneys/', '/our-lawyers/',
        '/about/attorneys/', '/about/team/'
      ],
      delayBetweenProfiles: 1000,
      contextWindowBefore: 1000,
      contextWindowAfter: 500,
      firecrawlOptions: {
        onlyMainContent: true,
        formats: ['markdown']
      },
      sameDomainOnly: true
    }
  };
}

/**
 * Merges a partial configuration with defaults
 */
export function mergeWithDefaults(
  apiKey: string,
  partialConfig?: Partial<ScraperConfig>
): ScraperConfig {
  const defaults = createDefaultConfig(apiKey, partialConfig?.verbose);

  if (!partialConfig) {
    return defaults;
  }

  return {
    firecrawlApiKey: apiKey,
    verbose: partialConfig.verbose ?? defaults.verbose,
    emailPattern: partialConfig.emailPattern ?? defaults.emailPattern,
    namePatterns: {
      ...defaults.namePatterns,
      ...partialConfig.namePatterns
    },
    jobTitlePatterns: {
      ...defaults.jobTitlePatterns,
      ...partialConfig.jobTitlePatterns
    },
    validationRules: {
      ...defaults.validationRules,
      ...partialConfig.validationRules
    },
    scrapingOptions: {
      ...defaults.scrapingOptions,
      ...partialConfig.scrapingOptions,
      firecrawlOptions: {
        ...defaults.scrapingOptions?.firecrawlOptions,
        ...partialConfig.scrapingOptions?.firecrawlOptions
      }
    }
  };
}

/**
 * Available preset types
 */
export type PresetType = 'default' | 'real-estate' | 'corporate' | 'consulting' | 'law-firm';

/**
 * Gets a preset configuration by name
 */
export function getPresetConfig(
  preset: PresetType,
  apiKey: string,
  verbose: boolean = false
): ScraperConfig {
  switch (preset) {
    case 'real-estate':
      return createRealEstateConfig(apiKey, verbose);
    case 'corporate':
      return createCorporateConfig(apiKey, verbose);
    case 'consulting':
      return createConsultingConfig(apiKey, verbose);
    case 'law-firm':
      return createLawFirmConfig(apiKey, verbose);
    case 'default':
    default:
      return createDefaultConfig(apiKey, verbose);
  }
}
