import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse plan from request body
  let plan: 'pro' | 'agency' = 'pro';
  try {
    const body = await request.json();
    plan = body.plan === 'agency' ? 'agency' : 'pro';
  } catch {
    // Default to pro if no body or invalid JSON
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

  // Get the correct price ID based on plan
  const priceId = plan === 'agency' 
    ? process.env.STRIPE_AGENCY_PRICE_ID 
    : process.env.STRIPE_PRO_PRICE_ID;
    
  if (!priceId) {
    return NextResponse.json({ 
      error: `Stripe price not configured for ${plan} plan` 
    }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    metadata: { 
      supabase_user_id: user.id,
      plan: plan,
    },
  });

  return NextResponse.json({ url: session.url });
}
