import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ScriptPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-domain.com';
  const scriptTag = `<script src="${appUrl}/api/script/embed.js" defer></script>`;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Recovery Script</h1>
      <p className="text-muted-foreground mb-8">
        Embed this snippet in your site to automatically intercept broken link clicks and redirect
        visitors to your guardian backup URLs.
      </p>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Add to your site</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Paste this tag before the closing <code>&lt;/body&gt;</code> tag:
        </p>
        <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto select-all">
          {scriptTag}
        </pre>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">2. How it works</h2>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
          <li>The script intercepts all link clicks on your page.</li>
          <li>It checks if the link matches a Guardian backup URL.</li>
          <li>If a match is found, the visitor is redirected to the rescue URL instead.</li>
          <li>If no match, the original link works as normal.</li>
        </ol>
      </section>
    </div>
  );
}
