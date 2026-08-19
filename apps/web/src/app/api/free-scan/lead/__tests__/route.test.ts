import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => {
  const scanSingle = vi.fn();
  const scanEq = vi.fn(() => ({ single: scanSingle }));
  const scanSelect = vi.fn(() => ({ eq: scanEq }));
  const leadSingle = vi.fn();
  const leadSelect = vi.fn(() => ({ single: leadSingle }));
  const leadInsert = vi.fn(() => ({ select: leadSelect }));
  const from = vi.fn((table: string) => {
    if (table === 'free_scan_results') return { select: scanSelect };
    if (table === 'free_scan_leads') return { insert: leadInsert };
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from, leadInsert, leadSingle, scanSingle };
});

const email = vi.hoisted(() => ({ sendLeadNotification: vi.fn() }));

vi.mock('@linkrescue/database', () => ({
  createAdminClient: () => ({ from: database.from }),
}));

vi.mock('@linkrescue/email', () => email);

import { POST } from '../route';

function post(referrer?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (referrer) headers.referer = referrer;

  return POST(
    new NextRequest('http://localhost/api/free-scan/lead', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scanId: 'scan-123',
        email: 'Publisher@Example.com',
      }),
    }),
  );
}

beforeEach(() => {
  database.scanSingle.mockResolvedValue({
    data: {
      domain: 'publisher.example',
      broken_links_count: 4,
      broken_affiliate_count: 2,
    },
    error: null,
  });
  database.leadSingle.mockResolvedValue({ data: { id: 'lead-123' }, error: null });
  email.sendLeadNotification.mockResolvedValue({ id: 'email-123' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/free-scan/lead', () => {
  it('stores the campaign-bearing page referrer with the captured lead', async () => {
    const referrer =
      'https://www.linkrescue.io/free-scan?utm_source=linkedin&utm_medium=organic&utm_campaign=pilot_linkedin';

    const response = await post(referrer);

    expect(response.status).toBe(200);
    expect(database.leadInsert).toHaveBeenCalledWith({
      email: 'publisher@example.com',
      site_url: 'publisher.example',
      source: 'free-scan-postgate',
      referrer,
      broken_links_count: 4,
      affiliate_issues_count: 2,
      scanned_at: expect.any(String),
    });
    expect(email.sendLeadNotification).toHaveBeenCalledWith({
      leadId: 'lead-123',
      email: 'publisher@example.com',
      siteUrl: 'publisher.example',
      source: 'free-scan-postgate',
      details: '4 broken links; 2 affiliate issues in the limited snapshot',
    });
  });

  it('stores a null referrer when the browser does not send one', async () => {
    const response = await post();

    expect(response.status).toBe(200);
    expect(database.leadInsert).toHaveBeenCalledWith(
      expect.objectContaining({ referrer: null }),
    );
  });

  it('keeps the successful lead response when the owner alert fails', async () => {
    email.sendLeadNotification.mockRejectedValueOnce(new Error('Resend unavailable'));

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('does not attempt an alert when the lead insert fails', async () => {
    database.leadSingle.mockResolvedValueOnce({ data: null, error: new Error('DB unavailable') });

    const response = await post();

    expect(response.status).toBe(500);
    expect(email.sendLeadNotification).not.toHaveBeenCalled();
  });
});
