import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, single };
});

const email = vi.hoisted(() => ({ sendLeadNotification: vi.fn() }));

vi.mock('@linkrescue/database', () => ({
  createAdminClient: () => ({ from: () => ({ insert: database.insert }) }),
}));

vi.mock('@linkrescue/email', () => email);

import { POST } from '../route';

function post() {
  return POST(
    new NextRequest('http://localhost/api/recovery-inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'Agency@Example.com',
        siteUrl: 'https://agency.example',
        interest: 'monitoring-desk',
      }),
    }),
  );
}

beforeEach(() => {
  database.single.mockResolvedValue({ data: { id: 'lead-recovery-1' }, error: null });
  email.sendLeadNotification.mockResolvedValue({ id: 'email-1' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/recovery-inquiry', () => {
  it('alerts the owner after the inquiry is persisted', async () => {
    const response = await post();

    expect(response.status).toBe(200);
    expect(email.sendLeadNotification).toHaveBeenCalledWith({
      leadId: 'lead-recovery-1',
      email: 'agency@example.com',
      siteUrl: 'https://agency.example',
      source: 'pricing-monitoring-desk',
      details: 'Requested a managed monitoring readiness review',
    });
  });

  it('keeps the successful inquiry response when the owner alert fails', async () => {
    email.sendLeadNotification.mockRejectedValueOnce(new Error('Resend unavailable'));

    const response = await post();

    expect(response.status).toBe(200);
  });

  it('does not alert when persistence fails', async () => {
    database.single.mockResolvedValueOnce({ data: null, error: new Error('DB unavailable') });

    const response = await post();

    expect(response.status).toBe(500);
    expect(email.sendLeadNotification).not.toHaveBeenCalled();
  });
});
