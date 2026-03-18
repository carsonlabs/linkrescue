// Brand Configuration
// Centralized branding for LinkRescue - supports white-labeling

export const BRAND = {
  // Core Identity
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'LinkRescue',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Recover lost affiliate commissions from your content archive',
  
  // Visual
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '/logo.svg',
  favicon: process.env.NEXT_PUBLIC_BRAND_FAVICON || '/favicon.ico',
  
  // Colors (Tailwind classes or hex)
  colors: {
    primary: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#10b981', // emerald-500
    secondary: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR || '#3b82f6', // blue-500
    accent: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || '#8b5cf6', // violet-500
  },
  
  // Contact
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@linkrescue.io',
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || 'mailto:support@linkrescue.io',
  
  // URLs
  website: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://linkrescue.io',
  docs: process.env.NEXT_PUBLIC_DOCS_URL || 'https://linkrescue.io/docs',
  
  // Social (optional)
  twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@linkrescue',
  github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/carsonlabs/linkrescue',
  
  // Features (enable/disable for white-label)
  features: {
    showPricing: true,
    showDocs: true,
    showBlog: true,
    showGithub: true,
    allowSignup: true,
  },
} as const;

// Helper to get brand name with article
export function getBrandWithArticle() {
  const firstLetter = BRAND.name.charAt(0).toLowerCase();
  const article = ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
  return `${article} ${BRAND.name}`;
}

// Helper for meta tags
export function getMetaTitle(pageTitle?: string) {
  return pageTitle ? `${pageTitle} | ${BRAND.name}` : BRAND.name;
}

export function getMetaDescription() {
  return `${BRAND.name} - ${BRAND.tagline}`;
}
