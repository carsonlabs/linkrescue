'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';

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

type ScanStatus = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pagesScanned: number;
  linksChecked: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  createdAt: string;
};

export function ScanButton({
  siteId,
  compact = false,
  canScan = true,
  onComplete,
}: {
  siteId: string;
  compact?: boolean;
  canScan?: boolean;
  onComplete?: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/scan/status`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.scan) {
        setStatus(data.scan);
        if (data.scan.status === 'completed' || data.scan.status === 'failed') {
          setScanning(false);
          if (data.scan.status === 'completed') {
            onComplete?.();
          }
          if (data.scan.status === 'failed' && data.scan.error) {
            setError(data.scan.error);
          }
        }
      }
    } catch {
      // ignore polling errors
    }
  }, [siteId, onComplete]);

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [scanning, pollStatus]);

  const handleScan = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScanning(true);
    setError(null);
    setStatus(null);

    try {
      const res = await fetch(`/api/sites/${siteId}/scan`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start scan');
        setScanning(false);
        return;
      }

      // Scan completed (endpoint awaits the full scan)
      setScanning(false);
      setStatus({
        id: data.scanId,
        status: 'completed',
        pagesScanned: 0,
        linksChecked: 0,
        startedAt: null,
        finishedAt: new Date().toISOString(),
        error: null,
        createdAt: new Date().toISOString(),
      });
      onComplete?.();
    } catch {
      setError('Network error. Please try again.');
      setScanning(false);
    }
  };

  // Start polling immediately to pick up running scans
  useEffect(() => {
    pollStatus();
  }, [pollStatus]);

  // If there's already a running scan, show progress
  useEffect(() => {
    if (status?.status === 'running' || status?.status === 'pending') {
      setScanning(true);
    }
  }, [status]);

  if (!canScan && !scanning) {
    return compact ? null : (
      <p className="text-xs text-slate-500">
        Upgrade to Pro for on-demand scanning.
      </p>
    );
  }

  if (compact) {
    return (
      <>
        <button
          onClick={handleScan}
          disabled={scanning || !canScan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
        >
          {scanning ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {status?.linksChecked ? `${status.linksChecked} links...` : 'Scanning...'}
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Scan Now
            </>
          )}
        </button>
        {error && (
          <span className="text-xs text-red-400 ml-2">{error}</span>
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleScan}
        disabled={scanning || !canScan}
        className="flex items-center gap-2 bg-green-500 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-400 disabled:opacity-50 transition-all"
      >
        {scanning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Scan
          </>
        )}
      </button>

      {scanning && status && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-green-400" />
            <span className="text-slate-300">Scan in progress...</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>{status.linksChecked} links checked</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all animate-pulse"
              style={{ width: status.linksChecked > 0 ? '60%' : '15%' }}
            />
          </div>
        </div>
      )}

      {!scanning && status?.status === 'completed' && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          Scan complete
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
