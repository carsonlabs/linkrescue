import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-domain.com';

export default async function MonitoringSetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Monitoring Setup</h1>
      <p className="text-muted-foreground mb-8">
        Ingest server logs to automatically detect broken links hitting your site.
      </p>

      <ol className="space-y-8">
        <li>
          <h2 className="text-base font-semibold mb-2">1. Create a log source</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Go to <strong>Monitoring → Sources</strong> and create a new source. Choose your log format
            (nginx, apache, cloudflare, or custom JSON). Save the API key shown — it&apos;s only shown once.
          </p>
        </li>

        <li>
          <h2 className="text-base font-semibold mb-2">2. Send logs via cURL</h2>
          <p className="text-sm text-muted-foreground mb-2">Replace <code>YOUR_API_KEY</code> with your key:</p>
          <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`# Nginx: pipe your access.log
tail -n 1000 /var/log/nginx/access.log | \\
  curl -X POST "${appUrl}/api/logs/ingest/YOUR_API_KEY" \\
  -H "Content-Type: text/plain" \\
  --data-binary @-`}
          </pre>
        </li>

        <li>
          <h2 className="text-base font-semibold mb-2">3. Cloudflare Logpush</h2>
          <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`# Destination URL in Logpush config:
${appUrl}/api/logs/ingest/YOUR_API_KEY`}
          </pre>
        </li>

        <li>
          <h2 className="text-base font-semibold mb-2">4. View incidents</h2>
          <p className="text-sm text-muted-foreground">
            Return to the <strong>Monitoring</strong> page to see broken URLs sorted by hit count.
          </p>
        </li>
      </ol>
    </div>
  );
}
