import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, PLAN_LIMITS } from '@linkrescue/types';
import { CheckoutButton } from '@/components/checkout-button';

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_price_id')
      .eq('id', user.id)
      .single();
    currentPlan = getUserPlan(profile?.stripe_price_id ?? null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="border rounded-lg p-8 space-y-4">
            <h2 className="text-2xl font-bold">Free</h2>
            <p className="text-4xl font-bold">
              $0<span className="text-lg text-muted-foreground font-normal">/month</span>
            </p>
            <ul className="space-y-2 text-sm">
              <li>&#10003; {PLAN_LIMITS.free.sites} site</li>
              <li>&#10003; {PLAN_LIMITS.free.pagesPerScan} pages per scan</li>
              <li>&#10003; Weekly email digests</li>
              <li>&#10003; All issue types detected</li>
            </ul>
            {!user ? (
              <Link
                href="/signup"
                className="block w-full text-center bg-secondary text-secondary-foreground py-2 rounded-md font-medium hover:opacity-90"
              >
                Get Started
              </Link>
            ) : currentPlan === 'free' ? (
              <div className="w-full text-center py-2 text-muted-foreground font-medium">
                Current Plan
              </div>
            ) : null}
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary rounded-lg p-8 space-y-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
              Popular
            </div>
            <h2 className="text-2xl font-bold">Pro</h2>
            <p className="text-4xl font-bold">
              $29<span className="text-lg text-muted-foreground font-normal">/month</span>
            </p>
            <ul className="space-y-2 text-sm">
              <li>&#10003; {PLAN_LIMITS.pro.sites} sites</li>
              <li>&#10003; {PLAN_LIMITS.pro.pagesPerScan} pages per scan</li>
              <li>&#10003; Weekly email digests</li>
              <li>&#10003; All issue types detected</li>
              <li>&#10003; Priority support</li>
            </ul>
            {!user ? (
              <Link
                href="/signup"
                className="block w-full text-center bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90"
              >
                Get Started
              </Link>
            ) : currentPlan === 'pro' ? (
              <div className="w-full text-center py-2 text-muted-foreground font-medium">
                Current Plan
              </div>
            ) : (
              <CheckoutButton />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
