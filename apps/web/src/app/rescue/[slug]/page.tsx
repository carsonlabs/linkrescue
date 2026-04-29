import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shield, ExternalLink, AlertTriangle } from 'lucide-react';
import { createAdminClient } from '@linkrescue/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rescue link · LinkRescue',
  robots: { index: false, follow: false },
};

export default async function RescueInterstitialPage({
  params,
}: {
  params: { slug: string };
}) {
  const adminDb = createAdminClient();

  const { data: linkData } = await adminDb
    .from('guardian_links')
    .select('id, slug, backup_url, status')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  if (!linkData) notFound();

  let destination: URL;
  try {
    destination = new URL(linkData.backup_url);
  } catch {
    notFound();
  }
  if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
    notFound();
  }

  const continueHref = `/api/rescue/${linkData.slug}?confirmed=1`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="border bg-card rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Rescued by LinkRescue</h1>
              <p className="text-sm text-muted-foreground">
                The original link was unavailable. We're sending you to the backup.
              </p>
            </div>
          </div>

          <div className="border rounded-lg bg-muted/40 p-4 mb-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              You'll be redirected to
            </p>
            <p className="font-mono text-sm break-all">{destination.hostname}</p>
            <p className="font-mono text-xs text-muted-foreground break-all mt-1">
              {destination.toString()}
            </p>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground mb-6">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Verify the destination above before continuing. LinkRescue does not endorse
              third-party sites.
            </p>
          </div>

          <a
            href={continueHref}
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            rel="noopener nofollow"
          >
            Continue to {destination.hostname}
            <ExternalLink className="w-4 h-4" />
          </a>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Powered by{' '}
            <Link href="/" className="underline hover:text-foreground">
              LinkRescue
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
