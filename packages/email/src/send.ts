import { Resend } from 'resend';

export async function sendEmail({
  to,
  subject,
  react,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  idempotencyKey?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  if (!from) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  // Lazily construct so configuration failures are isolated to email delivery.
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    {
      from,
      to,
      subject,
      react,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
