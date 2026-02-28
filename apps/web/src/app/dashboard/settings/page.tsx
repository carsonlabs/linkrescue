import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getTierLimits, hasFeature, type TierName } from '@linkrescue/types';
import { TestEmailButton } from '@/components/dashboard/test-email-button';
import { ApiKeysSection } from '@/components/dashboard/api-keys-section';
import { WebhookSettings } from '@/components/dashboard/webhook-settings';
import { SlackSettings } from '@/components/dashboard/slack-settings';
import Link from 'next/link';
import { User, CreditCard, Bell, Crown, Key, Webhook, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

  const plan = getUserPlan(profile?.stripe_price_id ?? null) as TierName;
  const tierLimits = getTierLimits(plan);
  const hasWebhooks = hasFeature(plan, 'webhooks');
  const hasSlack = hasFeature(plan, 'slack_integration');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Account */}
      <section className="border bg-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Account</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        </div>
      </section>

      {/* Billing */}
      <section className="border bg-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Plan & Billing</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{tierLimits.name} Plan</span>
                {plan !== 'free' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-3 h-3" />
                    {tierLimits.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tierLimits.sites} site{tierLimits.sites !== 1 ? 's' : ''}, {tierLimits.pagesPerScan === Infinity ? 'unlimited' : tierLimits.pagesPerScan} pages/scan
              </p>
            </div>
            {plan === 'free' ? (
              <Link
                href="/pricing"
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
              </Link>
            ) : (
              <form action="/api/stripe/portal" method="POST">
                <button
                  type="submit"
                  className="text-sm border px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Manage billing
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Email Notifications */}
      <section className="border bg-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Email Notifications</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly digest</p>
              <p className="text-xs text-muted-foreground">
                Sent every Monday with a summary of broken links found.
              </p>
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Send a test email to verify your notifications are working.
            </p>
            <TestEmailButton />
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="border bg-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <Key className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">API Keys</h2>
        </div>
        <div className="px-6 py-5">
          <ApiKeysSection plan={plan} rateLimit={tierLimits.apiReadRequestsPerHour} />
        </div>
      </section>

      {/* Outbound Webhooks */}
      <section className="border bg-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <Webhook className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Webhooks</h2>
        </div>
        <div className="px-6 py-5">
          <WebhookSettings hasAccess={hasWebhooks} />
        </div>
      </section>

      {/* Slack Integration */}
      <section className="border bg-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Slack Integration</h2>
        </div>
        <div className="px-6 py-5">
          <SlackSettings hasAccess={hasSlack} />
        </div>
      </section>
    </div>
  );
}
