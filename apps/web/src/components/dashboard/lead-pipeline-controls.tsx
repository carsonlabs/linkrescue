'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type LeadStatus = 'new' | 'replied' | 'qualified' | 'scope_sent' | 'won' | 'not_a_fit';

const statuses: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'replied', label: 'Replied' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'scope_sent', label: 'Scope sent' },
  { value: 'won', label: 'Won' },
  { value: 'not_a_fit', label: 'Not a fit' },
];

export function LeadPipelineControls({
  leadId,
  initialStatus,
  initialNotes,
}: {
  leadId: string;
  initialStatus: LeadStatus;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDirty = status !== initialStatus || notes !== (initialNotes ?? '');

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/owner/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadStatus: status, ownerNotes: notes }),
        });
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(data.error || 'Could not save lead details.');
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save lead details.');
      }
    });
  }

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <div className="grid gap-3 md:grid-cols-[11rem_1fr_auto] md:items-end">
        <label className="block text-xs font-medium text-slate-400">
          Pipeline status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus)}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-green-500/50 focus:outline-none"
          >
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-400">
          Private notes
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={4000}
            placeholder="Fit, next action, or scope context - visible only to you"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-green-500/50 focus:outline-none"
          />
        </label>
        <button type="button" onClick={save} disabled={!isDirty || isPending} className="btn-secondary h-10 text-sm disabled:cursor-not-allowed disabled:opacity-45">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4 text-green-400" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}
