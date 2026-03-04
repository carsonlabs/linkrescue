import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: 'noindex',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-16 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
          <ExternalLink className="w-4 h-4 text-slate-900" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">LinkRescue</span>
      </Link>

      {/* Error code */}
      <div className="font-display text-8xl md:text-9xl font-bold text-gradient mb-6 leading-none">
        404
      </div>

      <h1 className="font-display text-2xl md:text-3xl font-bold mb-4">
        This link is broken — ironically.
      </h1>
      <p className="text-slate-400 max-w-sm mb-10 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="btn-primary">
          Go home
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/dashboard/sites" className="btn-secondary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
