import { describe, expect, it } from 'vitest';
import { JUNE_2026_LINK_ROT_STUDY as study, percentage } from './link-rot-index';

describe('June 2026 Link Rot study evidence (corrected 2026-09-21)', () => {
  it('keeps the published checked-link denominator internally consistent', () => {
    expect(study.linksFound - study.linksSkippedByBudget).toBe(study.linksChecked);
  });

  it('derives the headline rates from counted observations', () => {
    expect(percentage(study.visibleBreaks, study.linksChecked)).toBe('4.5%');
    expect(percentage(study.blockedResponses, study.linksChecked)).toBe('5.7%');
  });

  it('visible breaks are exactly 4xx + 5xx + timeouts', () => {
    const b = study.issueBreakdown;
    expect(b.broken4xx + b.server5xx + b.timeout).toBe(study.visibleBreaks);
  });

  // Regression: the original page claimed 569 stripped tracking parameters.
  // Every one was a share button, photo credit, network hand-off or bot block.
  it('does not claim any lost tracking parameters', () => {
    expect(study.issueBreakdown.lostParams).toBe(0);
    expect(study.originallyPublished.lostParams).toBe(569);
  });
});
