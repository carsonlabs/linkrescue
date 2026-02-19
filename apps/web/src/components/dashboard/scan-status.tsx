'use client';

import { useState } from 'react';

export function VerifyButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; tag?: string } | null>(
    null
  );

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/sites/${siteId}/verify`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      setResult({ success: true });
      window.location.reload();
    } else {
      setResult({ error: data.error, tag: data.tag });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleVerify}
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify Ownership'}
      </button>
      {result?.success && (
        <p className="text-sm text-green-600">Site verified successfully!</p>
      )}
      {result?.error && (
        <div className="text-sm text-destructive space-y-1">
          <p>{result.error}</p>
          {result.tag && (
            <code className="block bg-muted p-2 rounded text-xs break-all">{result.tag}</code>
          )}
        </div>
      )}
    </div>
  );
}

export function ScanButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/sites/${siteId}/scan`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      setMessage('Scan started! Refresh the page in a few minutes to see results.');
    } else {
      setMessage(data.error || 'Failed to start scan');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleScan}
        disabled={loading}
        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Scanning...' : 'Run Scan'}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
