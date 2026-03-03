/**
 * Browser environment configurations for multi-environment link testing.
 * Used by Layer A (header simulation on Vercel) and Layer B (Playwright on VPS).
 */

export interface BrowserEnvironment {
  /** Machine-readable key */
  id: string;
  /** Human-readable label shown in the results matrix */
  label: string;
  /** Abbreviated name for compact display */
  shortName: string;
  /** User-Agent string sent with the request */
  userAgent: string;
  /** Additional headers per environment */
  headers: Record<string, string>;
  /** Short explanation shown in the UI */
  notes: string;
  /** Which Playwright browser engine to use (Layer B) */
  playwrightBrowser: 'chromium' | 'webkit';
  /** Playwright device descriptor name, if applicable (Layer B) */
  playwrightDevice?: string;
  /** Cookie policy for this environment */
  cookiePolicy: 'standard' | 'itp' | 'restricted';
}

export const BROWSER_ENVIRONMENTS: BrowserEnvironment[] = [
  {
    id: 'desktop-chrome',
    label: 'Desktop Chrome',
    shortName: 'Chrome',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    notes: 'Standard desktop baseline',
    playwrightBrowser: 'chromium',
    cookiePolicy: 'standard',
  },
  {
    id: 'mobile-safari',
    label: 'Mobile Safari (iOS)',
    shortName: 'Safari iOS',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    notes: 'ITP enforced — third-party cookies blocked, first-party cookie lifetime capped',
    playwrightBrowser: 'webkit',
    playwrightDevice: 'iPhone 14',
    cookiePolicy: 'itp',
  },
  {
    id: 'instagram-inapp',
    label: 'Instagram In-App Browser',
    shortName: 'Instagram',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 345.0.0.0.0 (iPhone16,1; iOS 18_2; en_US; en; scale=3.00; 1290x2796; 618940623)',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://l.instagram.com/',
    },
    notes: 'Custom WebView with restricted cookie/storage access. Known attribution killer.',
    playwrightBrowser: 'webkit',
    playwrightDevice: 'iPhone 14',
    cookiePolicy: 'restricted',
  },
  {
    id: 'facebook-inapp',
    label: 'Facebook In-App Browser',
    shortName: 'Facebook',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.0;FBBV/565804378;FBDV/iPhone16,1;FBMD/iPhone;FBSN/iOS;FBSV/18.2;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://lm.facebook.com/',
    },
    notes: 'Facebook WebView. Similar to Instagram but sometimes different redirect behavior.',
    playwrightBrowser: 'webkit',
    playwrightDevice: 'iPhone 14',
    cookiePolicy: 'restricted',
  },
  {
    id: 'tiktok-inapp',
    label: 'TikTok In-App Browser',
    shortName: 'TikTok',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BytedanceWebview/d8a21c6 musical_ly_38.0.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US FalconTag/76869BE0-E5BC-458E-B2A5-3EC724DF867A',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    notes: 'TikTok BytedanceWebview. Growing channel for creator-affiliates.',
    playwrightBrowser: 'webkit',
    playwrightDevice: 'iPhone 14',
    cookiePolicy: 'restricted',
  },
  {
    id: 'android-chrome',
    label: 'Android Chrome',
    shortName: 'Android',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.200 Mobile Safari/537.36',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    notes: 'Android mobile baseline for comparison',
    playwrightBrowser: 'chromium',
    playwrightDevice: 'Pixel 7',
    cookiePolicy: 'standard',
  },
];
