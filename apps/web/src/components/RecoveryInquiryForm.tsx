'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export function RecoveryInquiryForm({ interest }: { interest: 'recovery-sprint' | 'monitoring-desk' }) {
  const [email, setEmail] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const label = interest === 'monitoring-desk' ? 'Request a monitoring review' : 'Request a Recovery Sprint';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/recovery-inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, siteUrl, interest }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save your request.');
      setStatus('sent');
    } catch (err) {
      setStatus('error'); setError(err instanceof Error ? err.message : 'Could not save your request.');
    }
  }

  if (status === 'sent') return <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center text-sm text-green-300"><CheckCircle2 className="w-5 h-5 inline mr-2" />Request saved. We&apos;ll review the fit and follow up personally.</div>;
  return <form onSubmit={submit} className="mt-6 space-y-3">
    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@company.com" className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50" />
    <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} type="url" placeholder="https://yoursite.com (optional)" className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50" />
    <button disabled={status === 'sending'} className="btn-primary w-full justify-center disabled:opacity-50">{status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{label} <ArrowRight className="w-4 h-4" /></>}</button>
    {status === 'error' && <p className="text-xs text-red-400 text-center">{error}</p>}
    <p className="text-[11px] text-slate-500 text-center">We will only use this to review your enquiry and follow up personally. No automatic customer email is sent.</p>
  </form>;
}
