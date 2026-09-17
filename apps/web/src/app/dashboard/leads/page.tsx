import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Inbox, ShieldCheck } from 'lucide-react';
import { createAdminClient } from '@linkrescue/database';
import { createClient } from '@/lib/supabase/server';
import { LeadReplyActions } from '@/components/dashboard/lead-reply-actions';
import { LeadPipelineControls, type LeadStatus } from '@/components/dashboard/lead-pipeline-controls';

export const dynamic = 'force-dynamic';

type Lead = {
  id: string;
  email: string;
  site_url: string | null;
  source: string | null;
  referrer: string | null;
  broken_links_count: number | null;
  affiliate_issues_count: number | null;
  scanned_at: string | null;
  lead_status: LeadStatus | null;
  owner_notes: string | null;
  status_updated_at: string | null;
  created_at: string;
};

const SOURCE_LABELS: Record<string, string> = {
  'pricing-recovery-sprint': 'Recovery Sprint',
  'pricing-monitoring-desk': 'Monitoring Desk',
  'free-scan-postgate': 'Free scan',
  'link-checker': 'Link checker',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  replied: 'Replied',
  qualified: 'Qualified',
  scope_sent: 'Scope sent',
  won: 'Won',
  not_a_fit: 'Not a fit',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
  replied: 'border-purple-500/20 bg-purple-500/10 text-purple-200',
  qualified: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  scope_sent: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
  won: 'border-green-500/20 bg-green-500/10 text-green-200',
  not_a_fit: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
};

function displaySource(source: string | null) {
  return SOURCE_LABELS[source ?? ''] ?? 'Website enquiry';
}

function validSiteUrl(siteUrl: string | null) {
  if (!siteUrl) return null;

  try {
    const candidate = /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function campaignFromReferrer(referrer: string | null) {
  if (!referrer) return null;

  try {
    const campaign = new URL(referrer).searchParams.get('utm_campaign');
    return campaign?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || null;
  } catch {
    return null;
  }
}

export default async function LeadInboxPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const ownerEmail = process.env.LEAD_NOTIFICATION_EMAIL?.trim().toLowerCase();
  if (!ownerEmail || user.email?.trim().toLowerCase() !== ownerEmail) redirect('/dashboard');

  const adminDb = createAdminClient();
  const { data, error } = await (adminDb.from as Function)('free_scan_leads')
    .select('id, email, site_url, source, referrer, broken_links_count, affiliate_issues_count, scanned_at, lead_status, owner_notes, status_updated_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const leads = ((data ?? []) as Lead[]).filter((lead) => !lead.email.endsWith('@linkrescue.example'));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-400">
            <ShieldCheck className="h-4 w-4" /> Owner only
          </div>
          <h1 className="font-display text-3xl font-bold">Pilot lead inbox</h1>
          <p className="mt-1 text-sm text-slate-400">
            New enquiries from the public pilot. Reply personally before offering a scope or payment link.
          </p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm">
          <span className="font-display text-2xl font-bold text-green-400">{leads.length}</span>{' '}
          <span className="text-slate-300">active lead{leads.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {error ? (
        <div className="glass-card border-red-500/20 p-6">
          <p className="font-medium text-red-300">The lead inbox could not be loaded.</p>
          <p className="mt-1 text-sm text-slate-400">The public enquiry forms are unaffected. Please refresh in a moment.</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
            <Inbox className="h-7 w-7 text-green-400" />
          </div>
          <h2 className="font-display text-xl font-semibold">Your inbox is ready</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Leads from the recovery-sprint, monitoring-desk, free-scan, and link-checker forms will appear here.
          </p>
          <Link href="/pricing" className="btn-primary mt-6 inline-flex text-sm">
            View the public offer
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const siteHref = validSiteUrl(lead.site_url);
            const issues = (lead.broken_links_count ?? 0) + (lead.affiliate_issues_count ?? 0);
            const campaign = campaignFromReferrer(lead.referrer);
            const status = lead.lead_status ?? 'new';

            return (
              <article key={lead.id} className="glass-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-300">
                        {displaySource(lead.source)}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      {issues > 0 && (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                          {issues} issue{issues === 1 ? '' : 's'} found
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatDate(lead.created_at)}</span>
                      {campaign && <span className="text-xs text-purple-300">Campaign: {campaign}</span>}
                    </div>
                    <a href={`mailto:${lead.email}`} className="block truncate font-medium text-white hover:text-green-300">
                      {lead.email}
                    </a>
                    {lead.site_url && (
                      <p className="mt-1 truncate text-sm text-slate-400">{lead.site_url}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LeadReplyActions email={lead.email} siteUrl={lead.site_url} source={lead.source} />
                    {siteHref && (
                      <a
                        href={siteHref}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-sm"
                      >
                        <ExternalLink className="h-4 w-4" /> Open site
                      </a>
                    )}
                  </div>
                </div>
                <LeadPipelineControls leadId={lead.id} initialStatus={status} initialNotes={lead.owner_notes} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
