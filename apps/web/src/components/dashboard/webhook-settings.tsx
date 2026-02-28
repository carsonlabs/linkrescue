'use client';

import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, AlertCircle, Check, Loader2, Send, Copy } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  last_triggered_at: string | null;
  created_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  'scan.completed': 'Scan Completed',
  'scan.failed': 'Scan Failed',
  'link.broken': 'Link Broken',
  'link.fixed': 'Link Fixed',
};

const ALL_EVENTS = Object.keys(EVENT_LABELS);

export function WebhookSettings({ hasAccess }: { hasAccess: boolean }) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['scan.completed']);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/v1/webhooks');
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchWebhooks();
    else setLoading(false);
  }, [hasAccess]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || newEvents.length === 0) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create webhook');
      }

      const data = await res.json();
      setNewSecret(data.webhook.secret);
      setNewUrl('');
      setNewEvents(['scan.completed']);
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setError(null);

    try {
      const res = await fetch('/api/v1/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test webhook failed');
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="glass-card p-6 text-center">
        <Webhook className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h3 className="font-semibold mb-1">Outbound Webhooks</h3>
        <p className="text-sm text-slate-400 mb-4">
          Get notified in real-time when scans complete or links break. Available on Agency plan.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm bg-green-500 text-slate-900 px-4 py-2 rounded-xl font-medium hover:bg-green-400 transition-colors"
        >
          Upgrade to Agency
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {newSecret && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-green-400">Webhook Created!</h4>
              <p className="text-sm text-slate-400 mt-1">
                Save this signing secret — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 bg-slate-900/50 border border-white/10 px-3 py-2 rounded text-sm font-mono break-all text-slate-300">
                  {newSecret}
                </code>
                <button
                  onClick={() => copyToClipboard(newSecret)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <button
                onClick={() => setNewSecret(null)}
                className="mt-3 text-sm text-green-400 hover:text-green-300 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{webhooks.length} webhook endpoint{webhooks.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 text-sm bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg font-medium hover:bg-green-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="glass-card p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Endpoint URL</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm focus:outline-none focus:border-green-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Events</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((event) => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    newEvents.includes(event)
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'text-slate-500 border-white/10 hover:border-white/20'
                  }`}
                >
                  {EVENT_LABELS[event]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={creating || !newUrl.trim() || newEvents.length === 0}
              className="text-sm bg-green-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-sm border border-white/10 px-4 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {webhooks.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Webhook className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No webhook endpoints configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((hook) => (
            <div
              key={hook.id}
              className="glass-card p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <code className="text-sm text-slate-300 break-all">{hook.url}</code>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hook.events.map((event) => (
                    <span
                      key={event}
                      className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded"
                    >
                      {EVENT_LABELS[event] ?? event}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Created {new Date(hook.created_at).toLocaleDateString()}
                  {hook.last_triggered_at && (
                    <> · Last triggered {new Date(hook.last_triggered_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleTest(hook.id)}
                  disabled={testingId === hook.id}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Send test webhook"
                >
                  {testingId === hook.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(hook.id)}
                  disabled={deletingId === hook.id}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete webhook"
                >
                  {deletingId === hook.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
