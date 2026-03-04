import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
            </div>
            <span className="font-display font-bold">LinkRescue</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/link-checker" className="hover:text-white transition-colors">Link Checker</Link>
            <Link href="/affiliate-link-revenue-calculator" className="hover:text-white transition-colors">Calculator</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/affiliates" className="hover:text-white transition-colors">Affiliates</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} LinkRescue
          </p>
        </div>
      </div>
    </footer>
  );
}
