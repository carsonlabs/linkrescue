import { NextRequest, NextResponse } from 'next/server';

interface LeadPayload {
  email: string;
  monthlyLoss: number;
  annualLoss: number;
}

export async function POST(req: NextRequest) {
  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, monthlyLoss, annualLoss } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // ----------------------------------------------------------------
  // TODO: Insert lead into database
  // ----------------------------------------------------------------
  // Example with Supabase:
  //
  // import { createClient } from '@/lib/supabase/server';
  // const supabase = await createClient();
  // await supabase.from('calculator_leads').insert({
  //   email,
  //   monthly_loss: monthlyLoss,
  //   annual_loss: annualLoss,
  //   created_at: new Date().toISOString(),
  // });
  // ----------------------------------------------------------------

  // ----------------------------------------------------------------
  // TODO: Send transactional email (Postmark / Resend)
  // ----------------------------------------------------------------
  // Example with Resend:
  //
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'LinkRescue <hello@linkrescue.io>',
  //   to: email,
  //   subject: `You're losing ~$${monthlyLoss.toLocaleString()}/month to broken affiliate links`,
  //   html: `<p>Your estimated annual loss is <strong>$${annualLoss.toLocaleString()}</strong>...</p>`,
  // });
  // ----------------------------------------------------------------

  // ----------------------------------------------------------------
  // TODO: Tag subscriber in email marketing list (ConvertKit / ActiveCampaign / etc.)
  // ----------------------------------------------------------------
  // Example with ConvertKit:
  //
  // await fetch(`https://api.convertkit.com/v3/forms/${process.env.CK_FORM_ID}/subscribe`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     api_key: process.env.CK_API_KEY,
  //     email,
  //     tags: ['calculator-lead'],
  //     fields: { monthly_loss: monthlyLoss, annual_loss: annualLoss },
  //   }),
  // });
  // ----------------------------------------------------------------

  console.log('[calculator-lead]', { email, monthlyLoss, annualLoss });

  return NextResponse.json({ ok: true });
}
