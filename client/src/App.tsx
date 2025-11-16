import { useState } from 'react';
import { Mail, Search, Download, Loader2, AlertCircle, CheckCircle2, Users, FileText } from 'lucide-react';
import type { ContactInfo, ScrapeResult, ScrapeMode } from './types';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<ScrapeMode>('direct');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleScrape = async () => {
    // Validate inputs
    if (!apiKey.trim()) {
      setError('Please enter your Firecrawl API key');
      return;
    }

    if (!url.trim()) {
      setError('Please enter a URL to scrape');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, url, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    if (!result || result.contacts.length === 0) return;

    const dataStr = JSON.stringify(result.contacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!result || result.contacts.length === 0) return;

    const headers = ['Name', 'Email', 'Job Title', 'Profile URL'];
    const rows = result.contacts.map(c => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.jobTitle || ''}"`,
      `"${c.profileUrl}"`
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Email Scraper</h1>
          <p className="text-indigo-100">Extract contact information using Firecrawl API</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Firecrawl API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Firecrawl API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API key at{' '}
              <a
                href="https://firecrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700"
              >
                firecrawl.dev
              </a>
            </p>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/team"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Scraping Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Direct Mode */}
              <button
                onClick={() => setMode('direct')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'direct'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <FileText className={`w-5 h-5 mr-3 mt-0.5 ${mode === 'direct' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold mb-1 ${mode === 'direct' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Direct Page Scraping
                    </div>
                    <div className="text-sm text-gray-600">
                      Scrape all emails, names, and job titles directly from a single page
                    </div>
                  </div>
                </div>
              </button>

              {/* Profiles Mode */}
              <button
                onClick={() => setMode('profiles')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'profiles'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <Users className={`w-5 h-5 mr-3 mt-0.5 ${mode === 'profiles' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold mb-1 ${mode === 'profiles' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Profile Page Scraping
                    </div>
                    <div className="text-sm text-gray-600">
                      Find profile links on a team page, then scrape each profile individually
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Scrape Button */}
          <button
            onClick={handleScrape}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Start Scraping
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Results ({result.contacts.length} contacts found)
                </h2>
              </div>

              {result.contacts.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={exportToJSON}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </button>
                </div>
              )}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-semibold text-yellow-900 mb-2">Warnings:</div>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contacts Table */}
            {result.contacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Profile URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.contacts.map((contact: ContactInfo, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{contact.name}</td>
                        <td className="py-3 px-4 text-indigo-600">
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{contact.jobTitle || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <a
                            href={contact.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-sm"
                          >
                            View Profile
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No contacts found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
