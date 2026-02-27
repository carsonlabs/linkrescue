'use client';

import { useState, useEffect } from 'react';
import { Key, Copy, Plus, Trash2, AlertCircle, Check, Loader2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface ApiKeysSectionProps {
  plan: string;
  rateLimit: number;
}

export function ApiKeysSection({ plan, rateLimit }: ApiKeysSectionProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/v1/keys');
      if (!res.ok) throw new Error('Failed to fetch API keys');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const body: { name: string; expires_in_days?: number } = { name: newKeyName };
      if (newKeyExpiry) {
        body.expires_in_days = parseInt(newKeyExpiry);
      }

      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create API key');
      }

      const data = await res.json();
      setNewKey(data.key.full_key);
      setNewKeyName('');
      setNewKeyExpiry('');
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure? This will immediately revoke the API key.')) return;

    setRevokingId(id);
    try {
      const res = await fetch(`/api/v1/keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke API key');
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (plan === 'free') {
    return (
      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold mb-1">API Access</h3>
        <p className="text-sm text-muted-foreground mb-4">
          API access is available on Pro and Agency plans.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">API Key Created!</h4>
              <p className="text-sm text-green-700 mt-1">
                Copy this key now - you won&apos;t see it again!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 bg-green-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {newKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-700" />
                  ) : (
                    <Copy className="w-4 h-4 text-green-700" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="mt-3 text-sm text-green-700 hover:text-green-900 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Rate limit: <span className="font-medium text-foreground">{rateLimit}</span> requests/hour
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Key Name</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API"
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expires (optional)</label>
            <select
              value={newKeyExpiry}
              onChange={(e) => setNewKeyExpiry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            >
              <option value="">Never</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={creating || !newKeyName.trim()}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-sm border px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {keys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{key.name}</span>
                  {key.revoked_at && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      Revoked
                    </span>
                  )}
                  {key.expires_at && !key.revoked_at && new Date(key.expires_at) < new Date() && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Expired
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded">{key.key_prefix}...</code>
                  <span>Created {formatDate(key.created_at)}</span>
                  {key.last_used_at && <span>• Used {formatDate(key.last_used_at)}</span>}
                </div>
              </div>
              {!key.revoked_at && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Revoke key"
                >
                  {revokingId === key.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground pt-2">
        <p>
          Need help? Check out the{' '}
          <a href="/docs/api" className="text-primary hover:underline">
            API documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}
