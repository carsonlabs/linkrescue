import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { STRIPE_PRICE_IDS } from '@linkrescue/types';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse plan, billing interval, and referral from request body
  let plan: 'pro' | 'agency' = 'pro';
  let interval: 'monthly' | 'annual' = 'monthly';
  let referralId: string | undefined;
  try {
    const body = await request.json();
    plan = body.plan === 'agency' ? 'agency' : 'pro';
    interval = body.interval === 'annual' ? 'annual' : 'monthly';
    if (body.referral) referralId = body.referral;
  } catch {
    // Default to pro monthly if no body or invalid JSON
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Get the correct price ID based on plan and interval
  const priceKey = `${plan}_${interval}` as keyof typeof STRIPE_PRICE_IDS;
  const priceId = STRIPE_PRICE_IDS[priceKey];

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for ${plan} ${interval} plan` },
      { status: 500 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      plan,
      interval,
    },
    allow_promotion_codes: true,
    // Pass Rewardful referral ID for affiliate attribution
    ...(referralId ? { client_reference_id: referralId } : {}),
  });

  return NextResponse.json({ url: session.url });
}
