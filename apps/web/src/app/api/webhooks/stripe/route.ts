import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@linkrescue/database';
import type Stripe from 'stripe';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.metadata?.supabase_user_id) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await updateSubscription(supabase, session.metadata.supabase_user_id, subscription);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          if (event.type === 'customer.subscription.deleted') {
            await supabase
              .from('users')
              .update({
                stripe_subscription_id: null,
                stripe_price_id: null,
                stripe_current_period_end: null,
              })
              .eq('id', user.id);
          } else {
            await updateSubscription(supabase, user.id, subscription);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function updateSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      stripe_current_period_end: periodEnd,
    })
    .eq('id', userId);
}
