'use client';

import Link from 'next/link';
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[LinkRescue:Dashboard] Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>

      <h1 className="font-display text-2xl font-bold mb-3">
        Something went wrong
      </h1>
      <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
        We hit an unexpected error loading this page. Try refreshing, or head back to your dashboard.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={reset} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        <Link href="/dashboard" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
