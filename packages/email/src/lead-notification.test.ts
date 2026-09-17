import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const email = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock('./send', () => email);

import { sendLeadNotification } from './lead-notification';

const payload = {
  leadId: 'lead-123',
  email: 'publisher@example.com',
  siteUrl: 'publisher.example',
  source: 'free-scan-postgate',
};

beforeEach(() => {
  delete process.env.LEAD_NOTIFICATION_ENABLED;
  delete process.env.LEAD_NOTIFICATION_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  email.sendEmail.mockResolvedValue({ id: 'email-123' });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('sendLeadNotification', () => {
  it('defaults to disabled even when Resend configuration exists', async () => {
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'owner@example.com');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_FROM_EMAIL', 'LinkRescue <hello@linkrescue.io>');

    await expect(sendLeadNotification(payload)).resolves.toEqual({
      skipped: true,
      reason: 'disabled',
    });
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it('fails visibly when enabled without complete configuration', async () => {
    vi.stubEnv('LEAD_NOTIFICATION_ENABLED', 'true');

    await expect(sendLeadNotification(payload)).rejects.toThrow(
      'Lead notifications are enabled but',
    );
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it('sends only to the owner with a lead-specific idempotency key', async () => {
    vi.stubEnv('LEAD_NOTIFICATION_ENABLED', 'true');
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'owner@example.com');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_FROM_EMAIL', 'LinkRescue <hello@linkrescue.io>');

    await sendLeadNotification(payload);

    expect(email.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        subject: 'New LinkRescue lead: publisher.example',
        idempotencyKey: 'lead-notification/lead-123',
      }),
    );
  });
});
