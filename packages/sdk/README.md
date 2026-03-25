# @linkrescue/sdk

Official Node.js/TypeScript SDK for the [LinkRescue](https://linkrescue.io) broken link detection API.

## Install

```bash
npm install @linkrescue/sdk
```

## Quick Start

```typescript
import { LinkRescue } from '@linkrescue/sdk';

const lr = new LinkRescue('lr_your_api_key');

// Check a single URL
const result = await lr.checkLink('https://amzn.to/abc123');
console.log(result.status);                    // 'ok' | 'broken' | 'redirect'
console.log(result.affiliate_params_preserved); // true | false | null

// Check multiple URLs (auto-batches in groups of 20)
const { summary, results } = await lr.checkLinks([
  'https://amzn.to/abc123',
  'https://example.com/old-page',
  'https://shareasale.com/r.cfm?b=12345',
]);
console.log(summary); // { broken: 1, redirects: 1, params_lost: 0 }

// Async site scan (Agency plan)
const scan = await lr.scanAndWait('https://example.com');
console.log(scan.pages_scanned, scan.links_checked);
```

## API

### `new LinkRescue(apiKey, options?)`

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `https://app.linkrescue.io` | API base URL |
| `timeout` | `30000` | Request timeout (ms) |

### Methods

| Method | Plan | Description |
|--------|------|-------------|
| `checkLink(url)` | Pro+ | Check a single URL |
| `checkLinks(urls)` | Pro+ | Check multiple URLs (auto-batches) |
| `submitScan(url, opts?)` | Agency | Submit async site scan |
| `getScan(scanId)` | Agency | Poll scan status |
| `scanAndWait(url, opts?)` | Agency | Submit + poll until done |
| `listKeys()` | Pro+ | List your API keys |

### Error Handling

```typescript
import { LinkRescue, LinkRescueError } from '@linkrescue/sdk';

try {
  await lr.checkLink('https://example.com');
} catch (err) {
  if (err instanceof LinkRescueError) {
    console.log(err.status); // 429
    console.log(err.message); // 'Rate limit exceeded'
  }
}
```

## Get an API Key

API access starts at $29/mo (Pro plan). Sign up at [linkrescue.io](https://linkrescue.io).
