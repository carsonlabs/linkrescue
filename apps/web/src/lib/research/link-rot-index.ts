export const JUNE_2026_LINK_ROT_STUDY = {
  observedOn: '2026-06-11',
  panelSites: 50,
  substantiveSites: 34,
  partialBudgetSites: 23,
  pagesReviewed: 683,
  linksFound: 11_676,
  linksSkippedByBudget: 5_126,
  linksChecked: 6_550,
  visibleBreaks: 380,
  attributionFailures: 597,
  blockedResponses: 308,
  issueBreakdown: {
    broken4xx: 171,
    server5xx: 82,
    timeout: 127,
    lostParams: 569,
    redirectToHome: 28,
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
