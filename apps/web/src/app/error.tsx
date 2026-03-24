'use client';

import Link from 'next/link';
import { ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[LinkRescue] Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="flex items-center gap-2.5 mb-16 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
          <ExternalLink className="w-4 h-4 text-slate-900" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">LinkRescue</span>
      </Link>

      <div className="font-display text-8xl md:text-9xl font-bold text-gradient mb-6 leading-none">
        500
      </div>

      <h1 className="font-display text-2xl md:text-3xl font-bold mb-4">
        Something went wrong
      </h1>
      <p className="text-slate-400 max-w-sm mb-10 leading-relaxed">
        An unexpected error occurred. Try refreshing the page, or head back home.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={reset} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Go home
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
