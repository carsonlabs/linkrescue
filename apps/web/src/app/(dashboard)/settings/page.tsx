import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@linkrescue/types';
import { TestEmailButton } from '@/components/dashboard/test-email-button';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null);

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Account</h2>
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span> {user.email}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Plan:</span>{' '}
            <span className="capitalize font-medium">{plan}</span>
          </p>
          {plan === 'free' && (
            <a
              href="/pricing"
              className="inline-block text-sm text-primary underline hover:no-underline mt-1"
            >
              Upgrade to Pro
            </a>
          )}
          {plan === 'pro' && (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="text-sm text-primary underline hover:no-underline"
              >
                Manage Billing
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Email Notifications</h2>
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Weekly digest emails are sent automatically with scan results.
          </p>
          <TestEmailButton />
        </div>
      </section>
    </div>
  );
}
