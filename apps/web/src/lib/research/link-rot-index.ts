/**
 * June 2026 research scan — counted observations.
 *
 * Corrected 2026-09-21. The original classifier counted any tracking-looking
 * parameter missing from a final URL as "lost", so share buttons, photo credits
 * and affiliate networks consuming their own parameters were all reported as
 * attribution failures (569 of them). Re-classifying the same stored June
 * observations with the corrected rules (packages/crawler/src/attribution.ts)
 * found no case of a tracking tag failing to reach the network or merchant.
 * `originallyPublished` keeps the superseded figures for the correction note.
 */
export const JUNE_2026_LINK_ROT_STUDY = {
  observedOn: '2026-06-11',
  correctedOn: '2026-09-21',
  panelSites: 50,
  substantiveSites: 34,
  partialBudgetSites: 23,
  pagesReviewed: 683,
  linksFound: 11_676,
  linksSkippedByBudget: 5_126,
  linksChecked: 6_550,
  visibleBreaks: 295,
  /** 403/405/429, bot or captcha landing pages, and Amazon 5xx throttling. */
  blockedResponses: 372,
  /** Issue observations that were share buttons or photo credits, now excluded. */
  utilityLinksExcluded: 375,
  issueBreakdown: {
    broken4xx: 150,
    server5xx: 18,
    timeout: 127,
    lostParams: 0,
    redirectToHome: 28,
    expiredProgram: 6,
  },
  originallyPublished: {
    visibleBreaks: 380,
    attributionFailures: 597,
    lostParams: 569,
    blockedResponses: 308,
  },
  limits: {
    maxPagesPerSite: 20,
    softBudgetSecondsPerSite: 100,
    hardStopSecondsPerSite: 300,
    requestTimeoutSeconds: 10,
    maxRedirectHops: 5,
  },
} as const;

export function percentage(count: number, total: number): string {
  return `${((count / total) * 100).toFixed(1)}%`;
}
