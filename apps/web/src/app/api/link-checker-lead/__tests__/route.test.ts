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
    new NextRequest('http://localhost/api/link-checker-lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'Publisher@Example.com',
        siteUrl: 'https://publisher.example',
        source: 'link-checker',
      }),
    }),
  );
}

beforeEach(() => {
  database.single.mockResolvedValue({ data: { id: 'lead-checker-1' }, error: null });
  email.sendLeadNotification.mockResolvedValue({ id: 'email-1' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/link-checker-lead', () => {
  it('alerts the owner after the lead is persisted', async () => {
    const response = await post();

    expect(response.status).toBe(200);
    expect(email.sendLeadNotification).toHaveBeenCalledWith({
      leadId: 'lead-checker-1',
      email: 'publisher@example.com',
      siteUrl: 'https://publisher.example',
      source: 'link-checker',
      details: 'Lead captured from the header-based link checker',
    });
  });

  it('does not alert when persistence fails', async () => {
    database.single.mockResolvedValueOnce({ data: null, error: new Error('DB unavailable') });

    const response = await post();

    expect(response.status).toBe(200);
    expect(email.sendLeadNotification).not.toHaveBeenCalled();
  });
});
