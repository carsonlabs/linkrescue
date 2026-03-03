/**
 * Browser environment configurations for multi-environment link testing.
 * Each entry simulates how a specific platform's browser handles requests.
 */

export interface BrowserEnvironment {
  /** Machine-readable key */
  id: string;
  /** Human-readable label shown in the results matrix */
  label: string;
  /** User-Agent string sent with the request */
  userAgent: string;
  /** Referer header (if applicable) */
  referer?: string;
  /**
   * If true, simulate ITP-like behaviour: suppress third-party cookies
   * by omitting Cookie headers and flagging cookie-dependent redirects.
   */
  simulateITP: boolean;
  /** Short explanation shown in the UI */
  description: string;
}

export const BROWSER_ENVIRONMENTS: BrowserEnvironment[] = [
  {
    id: 'desktop_chrome',
    label: 'Desktop Chrome',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    simulateITP: false,
    description: 'Standard desktop baseline',
  },
  {
    id: 'mobile_safari',
    label: 'Mobile Safari (iOS)',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    simulateITP: true,
    description: 'ITP strips third-party cookies',
  },
  {
    id: 'instagram',
    label: 'Instagram In-App',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 327.1.6',
    referer: 'https://l.instagram.com/',
    simulateITP: true,
    description: 'Known attribution killer',
  },
  {
    id: 'facebook',
    label: 'Facebook In-App',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/454.0;FBBV/0;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/en_US;FBOP/80]',
    referer: 'https://l.facebook.com/',
    simulateITP: true,
    description: 'In-app WebView, similar to Instagram',
  },
  {
    id: 'tiktok',
    label: 'TikTok In-App',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BytedanceWebview/d8a21c6',
    referer: 'https://www.tiktok.com/',
    simulateITP: true,
    description: 'Growing creator channel',
  },
  {
    id: 'android_chrome',
    label: 'Android Chrome',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    simulateITP: false,
    description: 'Mobile Android baseline',
  },
];
