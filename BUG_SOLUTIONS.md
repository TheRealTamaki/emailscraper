# Bug Solutions & Development Guidelines

Always check this file for existing fixes and patterns before fixing any bug.

## Bug Fixing Protocol

**CRITICAL**: When fixing a bug:
1. Identify the root cause
2. Implement the fix
3. Verify with linting
4. **ALWAYS** end with a simple one-sentence summary using exactly 3 alarm emojis (🚨🚨🚨)
   - This is **mandatory** and must be the very last sentence in your response

## Platform-Specific Guidelines

### macOS Commands & Shortcuts

Always provide Mac-specific keyboard shortcuts and terminal commands:
- Use `Cmd` instead of `Ctrl`
- Use `Option` instead of `Alt` where applicable
- Terminal commands should be macOS-compatible (e.g., `open .` instead of `xdg-open .`)

**Examples:**
- Stop server: `Cmd + C` (not Ctrl+C)
- Copy: `Cmd + C`
- Paste: `Cmd + V`
- Save: `Cmd + S`
- Open folder in Finder: `open .`

## Code Organization

### Shared Components

When adding UI elements that repeat between pages:
1. First check if an existing shared component can be reused
2. If not, refactor the repeated markup into a shared component
3. Place shared components in appropriate directories (e.g., `components/shared/`, `components/common/`)
4. **Complete this refactoring before finishing the task**

### Test Files

Delete any test files after confirming they are no longer needed:
- Don't leave temporary or experimental test files in the codebase
- Clean up after testing is complete
- Document any permanent test files with clear purposes

## Documentation Standards

### README Files

When creating or editing README files, **always** add these social media links at the top of the file, right after the main title:

```markdown
# Project Title

[![Twitter Follow](https://img.shields.io/twitter/follow/yourusername?style=social)](https://twitter.com/yourusername)
[![GitHub followers](https://img.shields.io/github/followers/yourusername?style=social)](https://github.com/yourusername)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/yourusername)
```

**Note:** Replace `yourusername` with actual usernames/handles.

## Common Bug Fixes

### Missing TypeScript Configuration Files

**Problem:** `ENOENT: no such file or directory, open 'tsconfig.app.json'`

**Solution:**
1. Create `tsconfig.app.json` for app-specific TypeScript config
2. Create `tsconfig.node.json` for Vite/Node config files
3. Update `.gitignore` to include `!tsconfig.*.json`

**Files:**
```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

### Type-Only Import Errors

**Problem:** `'X' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled`

**Solution:**
Use `import type` for type-only imports:
```typescript
// Bad
import { ContactInfo, ScrapeResult } from './types';

// Good
import type { ContactInfo, ScrapeResult } from './types';
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution (macOS):**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or kill multiple ports at once
kill -9 $(lsof -ti:3000) $(lsof -ti:3001)
```

### Git Ignore Not Working

**Problem:** Files that should be ignored are still tracked

**Solution:**
```bash
# Remove from Git cache
git rm -r --cached .

# Re-add everything (respecting .gitignore)
git add .

# Commit the changes
git commit -m "Fix: Update gitignore rules"
```

## Project-Specific Fixes

### Email Scraper - Name/Job Title Extraction

**Problem:** Direct scraping not extracting names or job titles

**Solution:**
- Prioritize H1 headers for names (`# Name`)
- Prioritize H2 headers for job titles (`## Job Title`)
- Increase context window (1000 chars before, 500 after email)
- Use multiple fallback strategies

**Code Pattern:**
```typescript
// Strategy 1 (PRIMARY): Look for H1 headers
const h1Matches = [...fullContext.matchAll(/^#\s+(.+?)$/gm)];
if (h1Matches.length > 0) {
  const h1 = h1Matches[h1Matches.length - 1][1].trim();
  if (h1.length > 0 && h1.length < 100 && !h1.includes('@')) {
    name = h1;
  }
}
```

## Reminder

🚨 **Always end bug fix responses with a one-sentence summary followed by exactly 3 alarm emojis!** 🚨
