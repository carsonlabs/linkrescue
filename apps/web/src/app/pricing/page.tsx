import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, PLAN_LIMITS } from '@linkrescue/types';
import { CheckoutButton } from '@/components/checkout-button';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
      {/* Nav */}
      <nav className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">LinkRescue</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/sites"
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when your site grows. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="border rounded-xl p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Free</h2>
              <p className="text-muted-foreground text-sm mt-1">Perfect for starting out</p>
            </div>
            <div className="text-4xl font-bold">
              $0
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                `${PLAN_LIMITS.free.sites} site`,
                `${PLAN_LIMITS.free.pagesPerScan} pages per scan`,
                'Weekly email digests',
                'All issue types detected',
                'Site verification',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            {!user ? (
              <Link
                href="/signup"
                className="block w-full text-center bg-secondary text-secondary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get started free
              </Link>
            ) : currentPlan === 'free' ? (
              <div className="w-full text-center py-2.5 border rounded-lg text-muted-foreground font-medium text-sm">
                Current plan
              </div>
            ) : null}
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary rounded-xl p-8 space-y-6 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
              Most popular
            </div>
            <div>
              <h2 className="text-xl font-bold">Pro</h2>
              <p className="text-muted-foreground text-sm mt-1">For serious affiliate sites</p>
            </div>
            <div className="text-4xl font-bold">
              $29
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                `${PLAN_LIMITS.pro.sites} sites`,
                `${PLAN_LIMITS.pro.pagesPerScan} pages per scan`,
                'Weekly email digests',
                'All issue types detected',
                'Site verification',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            {!user ? (
              <Link
                href="/signup"
                className="block w-full text-center bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get started free
              </Link>
            ) : currentPlan === 'pro' ? (
              <div className="w-full text-center py-2.5 border rounded-lg text-muted-foreground font-medium text-sm">
                Current plan
              </div>
            ) : (
              <CheckoutButton />
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include a 14-day free trial of Pro. No credit card required to start.
        </p>
      </div>
    </div>
  );
}
