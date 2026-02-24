'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 0 | 1 | 2 | 3;

interface ScanResult {
  scanId: string;
  leadId: string;
  brokenCount: number;
  affiliateCount: number;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function startScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start scan');

      setStep(1);
      // Poll for completion
      await pollStatus(data.scanId, data.leadId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus(scanId: string, leadId: string) {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/onboarding/status?scanId=${scanId}`);
      const data = await res.json();
      if (data.status === 'completed' || data.status === 'failed') {
        setResult({
          scanId,
          leadId,
          brokenCount: data.brokenCount ?? 0,
          affiliateCount: data.affiliateCount ?? 0,
        });
        await fetch('/api/onboarding/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, step: 2 }),
        });
        setStep(2);
        return;
      }
    }
    setError('Scan timed out. Please try again.');
    setStep(0);
  }

  return (
    <div className="border rounded-xl bg-background p-8 shadow-sm">
      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-8">
        {[0, 1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div>
          <h1 className="text-xl font-bold mb-1">Find broken links on your site</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and URL — we&apos;ll scan up to 10 pages for free.
          </p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="url"
              placeholder="https://your-site.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={startScan}
              disabled={loading || !email || !url}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Starting scan…' : 'Scan my site →'}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">Scanning your site…</h2>
          <p className="text-sm text-muted-foreground">This usually takes 20–60 seconds.</p>
        </div>
      )}

      {step === 2 && result && (
        <div>
          <h2 className="text-xl font-bold mb-1">Scan complete!</h2>
          <p className="text-sm text-muted-foreground mb-6">Here&apos;s what we found:</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{result.brokenCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Broken links</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-orange-500">{result.affiliateCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Broken affiliate links</p>
            </div>
          </div>
          <button
            onClick={() => setStep(3)}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            See full report →
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Start fixing broken links today</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create a free account to access your full report, set up guardian links, and recover lost revenue.
          </p>
          <Link
            href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="block w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors text-center"
          >
            Create free account
          </Link>
          <p className="text-xs text-muted-foreground mt-3">Free plan • No credit card required</p>
        </div>
      )}
    </div>
  );
}
