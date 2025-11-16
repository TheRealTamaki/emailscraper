export interface ContactInfo {
  name: string;
  email: string;
  jobTitle: string;
  profileUrl: string;
}

export interface ScrapeResult {
  success: boolean;
  contacts: ContactInfo[];
  errors: string[];
}

export type ScrapeMode = 'direct' | 'profiles';
