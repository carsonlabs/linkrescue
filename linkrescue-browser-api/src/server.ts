import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { chromium, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import { detectAffiliateParams, compareParamSurvival, type ParamSurvival } from './affiliate-params.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvironmentConfig {
  id: string;
  label: string;
  userAgent: string;
  playwrightBrowser: 'chromium' | 'webkit';
  playwrightDevice?: string;
  cookiePolicy: 'standard' | 'itp' | 'restricted';
  headers?: Record<string, string>;
}

interface ChainHop {
  url: string;
  statusCode: number;
  jsRedirect: boolean;
}

interface EnvironmentResult {
  environmentId: string;
  chain: ChainHop[];
  finalUrl: string;
  httpStatus: number;
  affiliateParams: ParamSurvival[];
  issues: string[];
  testMethod: 'browser-test';
  cookiesBlocked: boolean;
  jsRedirectDetected: boolean;
}

interface TestRequestBody {
  url: string;
  environments: EnvironmentConfig[];
}

/* ------------------------------------------------------------------ */
/*  Semaphore — limits concurrent browser contexts                     */
/* ------------------------------------------------------------------ */

class Semaphore {
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve();
      });
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Globals                                                            */
/* ------------------------------------------------------------------ */

const PORT = parseInt(process.env.PORT ?? '3847', 10);
const API_SECRET = process.env.API_SECRET ?? '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '';

let chromiumBrowser: Browser | null = null;
let webkitBrowser: Browser | null = null;

const semaphore = new Semaphore(3);

/* ------------------------------------------------------------------ */
/*  Browser lifecycle                                                  */
/* ------------------------------------------------------------------ */

async function ensureBrowsers(): Promise<void> {
  if (!chromiumBrowser || !chromiumBrowser.isConnected()) {
    console.log('[browser] Launching chromium...');
    chromiumBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    console.log('[browser] Chromium ready');
  }
  if (!webkitBrowser || !webkitBrowser.isConnected()) {
    console.log('[browser] Launching webkit...');
    webkitBrowser = await webkit.launch({ headless: true });
    console.log('[browser] Webkit ready');
  }
}

function getBrowser(engine: 'chromium' | 'webkit'): Browser {
  const browser = engine === 'chromium' ? chromiumBrowser : webkitBrowser;
  if (!browser || !browser.isConnected()) {
    throw new Error(`Browser ${engine} is not available`);
  }
  return browser;
}

async function shutdownBrowsers(): Promise<void> {
  console.log('[browser] Shutting down...');
  await chromiumBrowser?.close().catch(() => {});
  await webkitBrowser?.close().catch(() => {});
  chromiumBrowser = null;
  webkitBrowser = null;
}

/* ------------------------------------------------------------------ */
/*  Core test logic for a single environment                           */
/* ------------------------------------------------------------------ */

async function testEnvironment(
  url: string,
  env: EnvironmentConfig,
): Promise<EnvironmentResult> {
  const issues: string[] = [];
  const chain: ChainHop[] = [];
  let finalUrl = url;
  let httpStatus = 0;
  let cookiesBlocked = false;
  let jsRedirectDetected = false;

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  await semaphore.acquire();

  try {
    const browser = getBrowser(env.playwrightBrowser);

    // Build context options
    const contextOptions: Parameters<Browser['newContext']>[0] = {
      userAgent: env.userAgent,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    };

    // Apply device descriptor if specified
    if (env.playwrightDevice) {
      const { devices } = await import('playwright');
      const device = devices[env.playwrightDevice];
      if (device) {
        Object.assign(contextOptions, device);
        // Override UA back to our custom one (device sets a default)
        contextOptions.userAgent = env.userAgent;
      }
    }

    // Cookie policy simulation
    if (env.cookiePolicy === 'restricted') {
      // Block all third-party cookies in restricted environments
      contextOptions.storageState = { cookies: [], origins: [] };
    }

    context = await browser.newContext(contextOptions);

    // For ITP/restricted environments, block cookies via route interception
    if (env.cookiePolicy === 'itp' || env.cookiePolicy === 'restricted') {
      await context.route('**/*', (route) => {
        const request = route.request();
        const headers = request.headers();
        // Strip cookie headers to simulate blocked third-party cookies
        delete headers['cookie'];
        route.continue({ headers }).catch(() => {
          route.abort().catch(() => {});
        });
      });
    }

    // Set extra headers if provided
    if (env.headers && Object.keys(env.headers).length > 0) {
      await context.setExtraHTTPHeaders(env.headers);
    }

    page = await context.newPage();

    // Track navigation chain via response events
    const navigationChain: Array<{ url: string; status: number }> = [];

    page.on('response', (response) => {
      const request = response.request();
      if (request.isNavigationRequest()) {
        navigationChain.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Navigate and wait for network idle
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      if (response) {
        httpStatus = response.status();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Timeout') || message.includes('timeout')) {
        issues.push('Navigation timed out after 15s');
        httpStatus = 0;
      } else if (message.includes('net::ERR_')) {
        issues.push(`Network error: ${message}`);
        httpStatus = 0;
      } else {
        issues.push(`Navigation error: ${message}`);
        httpStatus = 0;
      }
    }

    // Get final URL from the page (accounts for JS redirects)
    finalUrl = page.url();

    // Build the redirect chain from tracked navigations
    let lastWas200 = false;
    for (const nav of navigationChain) {
      const isJsRedirect = lastWas200 && nav.status >= 200 && nav.status < 400;
      if (isJsRedirect) {
        jsRedirectDetected = true;
      }

      chain.push({
        url: nav.url,
        statusCode: nav.status,
        jsRedirect: isJsRedirect,
      });

      lastWas200 = nav.status >= 200 && nav.status < 300;
    }

    // If chain is empty (e.g. navigation error), add the original URL
    if (chain.length === 0) {
      chain.push({ url, statusCode: httpStatus, jsRedirect: false });
    }

    // Update httpStatus from the last chain entry if we got responses
    if (chain.length > 0 && httpStatus === 0) {
      const lastHop = chain[chain.length - 1];
      if (lastHop.statusCode > 0) {
        httpStatus = lastHop.statusCode;
      }
    }

    // Check cookies
    try {
      const cookies = await context.cookies(finalUrl);
      if (env.cookiePolicy !== 'standard' && cookies.length === 0) {
        cookiesBlocked = true;
      }
    } catch {
      // Cookie check failed, not critical
    }

    // Detect issues
    if (httpStatus >= 400) {
      issues.push(`HTTP ${httpStatus} error on final URL`);
    }

    if (chain.length > 5) {
      issues.push(`Excessive redirect chain (${chain.length} hops)`);
    }

    if (jsRedirectDetected) {
      issues.push('JavaScript redirect detected — may break tracking in some environments');
    }

    if (cookiesBlocked && (env.cookiePolicy === 'itp' || env.cookiePolicy === 'restricted')) {
      issues.push(`Cookies blocked in ${env.cookiePolicy === 'itp' ? 'ITP' : 'restricted'} environment`);
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    issues.push(`Browser test failed: ${message}`);
  } finally {
    // Close context (not the browser) to prevent memory leaks
    try {
      await page?.close().catch(() => {});
    } catch {
      // Ignore
    }
    try {
      await context?.close().catch(() => {});
    } catch {
      // Ignore
    }
    semaphore.release();
  }

  // Compare affiliate params between original and final URL
  const affiliateParams = compareParamSurvival(url, finalUrl);

  // Add issues for lost params
  for (const p of affiliateParams) {
    if (!p.survived) {
      issues.push(`Affiliate param "${p.param}" (${p.network}) was stripped during redirect`);
    }
  }

  return {
    environmentId: env.id,
    chain,
    finalUrl,
    httpStatus,
    affiliateParams,
    issues,
    testMethod: 'browser-test',
    cookiesBlocked,
    jsRedirectDetected,
  };
}

/* ------------------------------------------------------------------ */
/*  Express app                                                        */
/* ------------------------------------------------------------------ */

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: ALLOWED_ORIGIN || '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  }),
);

// API key authentication middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check
  if (req.path === '/health') {
    next();
    return;
  }

  if (!API_SECRET) {
    res.status(500).json({ error: 'Server misconfigured: API_SECRET not set' });
    return;
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_SECRET) {
    res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
    return;
  }

  next();
}

app.use(authMiddleware);

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.post('/health', (_req: Request, res: Response): void => {
  const chromiumOk = chromiumBrowser?.isConnected() ?? false;
  const webkitOk = webkitBrowser?.isConnected() ?? false;

  res.json({
    status: chromiumOk && webkitOk ? 'ok' : 'degraded',
    browsers: {
      chromium: chromiumOk ? 'connected' : 'disconnected',
      webkit: webkitOk ? 'connected' : 'disconnected',
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/test', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<TestRequestBody>;

  // Validate request
  if (!body.url || typeof body.url !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "url" field' });
    return;
  }

  if (!body.environments || !Array.isArray(body.environments) || body.environments.length === 0) {
    res.status(400).json({ error: 'Missing or empty "environments" array' });
    return;
  }

  // Validate URL
  const urlStr = body.url.trim();
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
    return;
  }

  // Block private IPs
  const hostname = parsed.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    res.status(400).json({ error: 'Private/internal URLs are not allowed' });
    return;
  }

  // Cap environments to a reasonable limit
  const environments = body.environments.slice(0, 10);

  // Ensure browsers are alive
  try {
    await ensureBrowsers();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Browser launch failed: ${message}` });
    return;
  }

  // Detect affiliate params on the original URL
  const originalParams = detectAffiliateParams(urlStr);

  // Run all environment tests in parallel
  const results = await Promise.allSettled(
    environments.map((env) => testEnvironment(urlStr, env)),
  );

  // Collect results — if one env fails, still return results for others
  const environmentResults: EnvironmentResult[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const env = environments[i];

    if (result.status === 'fulfilled') {
      environmentResults.push(result.value);
    } else {
      // Return a failure result for this environment
      const reason = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);

      environmentResults.push({
        environmentId: env.id,
        chain: [{ url: urlStr, statusCode: 0, jsRedirect: false }],
        finalUrl: urlStr,
        httpStatus: 0,
        affiliateParams: originalParams.map((p) => ({
          param: p.param,
          network: p.network,
          originalValue: p.value,
          survived: false,
          finalValue: null,
        })),
        issues: [`Environment test failed: ${reason}`],
        testMethod: 'browser-test',
        cookiesBlocked: false,
        jsRedirectDetected: false,
      });
    }
  }

  res.json({
    originalUrl: urlStr,
    originalAffiliateParams: originalParams,
    environments: environmentResults,
    testedAt: new Date().toISOString(),
  });
});

// Catch-all for unknown routes
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
});

/* ------------------------------------------------------------------ */
/*  Startup & shutdown                                                 */
/* ------------------------------------------------------------------ */

async function start(): Promise<void> {
  console.log('[server] Starting LinkRescue Browser API...');

  // Launch browsers on startup for warm starts
  await ensureBrowsers();

  app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT}`);
    console.log(`[server] CORS origin: ${ALLOWED_ORIGIN || '* (all origins)'}`);
    console.log(`[server] API auth: ${API_SECRET ? 'enabled' : 'DISABLED (no API_SECRET set)'}`);
  });
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`[server] Received ${signal}, shutting down gracefully...`);
  await shutdownBrowsers();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
