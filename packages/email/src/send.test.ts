import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resend = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resend.send };
  },
}));

import { sendEmail } from './send';

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_test');
  vi.stubEnv('RESEND_FROM_EMAIL', 'LinkRescue <hello@linkrescue.io>');
  resend.send.mockResolvedValue({ data: { id: 'email-123' }, error: null });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('sendEmail', () => {
  it('passes the idempotency key through the Resend request options', async () => {
    const react = React.createElement('p', null, 'Lead captured');

    await sendEmail({
      to: 'owner@example.com',
      subject: 'New lead',
      react,
      idempotencyKey: 'lead-notification/lead-123',
    });

    expect(resend.send).toHaveBeenCalledWith(
      {
        from: 'LinkRescue <hello@linkrescue.io>',
        to: 'owner@example.com',
        subject: 'New lead',
        react,
      },
      { idempotencyKey: 'lead-notification/lead-123' },
    );
  });
});
