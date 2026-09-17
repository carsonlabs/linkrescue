import { describe, expect, it } from 'vitest';
import { JUNE_2026_LINK_ROT_STUDY as study, percentage } from './link-rot-index';

describe('June 2026 Link Rot study evidence', () => {
  it('keeps the published checked-link denominator internally consistent', () => {
    expect(study.linksFound - study.linksSkippedByBudget).toBe(study.linksChecked);
  });

  it('derives the two approved headline rates from counted observations', () => {
    expect(percentage(study.visibleBreaks, study.linksChecked)).toBe('5.8%');
    expect(percentage(study.attributionFailures, study.linksChecked)).toBe('9.1%');
  });

  it('keeps the issue categories and bot-blocked responses explicit', () => {
    expect(
      study.issueBreakdown.broken4xx +
        study.issueBreakdown.server5xx +
        study.issueBreakdown.timeout
    ).toBe(study.visibleBreaks);
    expect(study.issueBreakdown.lostParams + study.issueBreakdown.redirectToHome).toBe(
      study.attributionFailures
    );
    expect(study.blockedResponses).not.toBe(0);
  });
});
