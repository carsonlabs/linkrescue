'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, AlertCircle, Check, Send, Trash2 } from 'lucide-react';

interface SlackIntegration {
  id: string;
  webhook_url: string;
  channel_name: string | null;
  notify_broken: boolean;
  notify_scan: boolean;
  notify_weekly: boolean;
  is_active: boolean;
}

export function SlackSettings({ hasAccess }: { hasAccess: boolean }) {
  const [integration, setIntegration] = useState<SlackIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Form state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [notifyBroken, setNotifyBroken] = useState(true);
  const [notifyScan, setNotifyScan] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(true);

  const fetchIntegration = async () => {
    try {
      const res = await fetch('/api/v1/slack');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.integration) {
        setIntegration(data.integration);
        setWebhookUrl(data.integration.webhook_url);
        setChannelName(data.integration.channel_name || '');
        setNotifyBroken(data.integration.notify_broken);
        setNotifyScan(data.integration.notify_scan);
        setNotifyWeekly(data.integration.notify_weekly);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchIntegration();
    else setLoading(false);
  }, [hasAccess]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          channel_name: channelName || null,
          notify_broken: notifyBroken,
          notify_scan: notifyScan,
          notify_weekly: notifyWeekly,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await res.json();
      setIntegration(data.integration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/v1/slack/test', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Test failed');
      }
      setTestResult('success');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove Slack integration?')) return;
    setDeleting(true);

    try {
      await fetch('/api/v1/slack', { method: 'DELETE' });
      setIntegration(null);
      setWebhookUrl('');
      setChannelName('');
      setNotifyBroken(true);
      setNotifyScan(true);
      setNotifyWeekly(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setDeleting(false);
    }
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
        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h3 className="font-semibold mb-1">Slack Notifications</h3>
        <p className="text-sm text-slate-400 mb-4">
          Get broken link alerts and scan summaries in Slack. Available on Agency plan.
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

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Slack Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm focus:outline-none focus:border-green-500/50"
            required
          />
          <p className="text-xs text-slate-600 mt-1">
            Create an incoming webhook in your Slack workspace settings.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Channel Name (optional)</label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="#link-monitoring"
            className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm focus:outline-none focus:border-green-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notification Types</label>
          <div className="space-y-2">
            {[
              { key: 'broken', label: 'New broken links', value: notifyBroken, setter: setNotifyBroken },
              { key: 'scan', label: 'Scan completions', value: notifyScan, setter: setNotifyScan },
              { key: 'weekly', label: 'Weekly summary', value: notifyWeekly, setter: setNotifyWeekly },
            ].map(({ key, label, value, setter }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setter(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-green-500 focus:ring-green-500/20"
                />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || !webhookUrl.trim()}
            className="text-sm bg-green-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : integration ? 'Update' : 'Connect'}
          </button>

          {integration && (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1.5 text-sm border border-white/10 px-3 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : testResult === 'success' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Test
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-sm text-red-400 border border-red-500/20 px-3 py-2 rounded-lg font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove
              </button>
            </>
          )}
        </div>

        {testResult === 'success' && (
          <p className="text-sm text-green-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Test message sent to Slack!
          </p>
        )}
        {testResult === 'error' && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Failed to send. Check your webhook URL.
          </p>
        )}
      </form>
    </div>
  );
}
