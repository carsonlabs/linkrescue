import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { LinkChecker } from '@/components/LinkChecker';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const PAGE_URL = 'https://www.linkrescue.io/link-checker';

export const metadata: Metadata = {
  title: 'Free Affiliate Link Header Check',
  description: 'Inspect an affiliate URL for HTTP status, redirect paths, and visible tracking parameters. No sign-up required.',
  alternates: { canonical: PAGE_URL },
};

export default function LinkCheckerPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNav />
      <main className="container mx-auto px-6 pt-32 pb-24">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 badge-green mb-6"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Free · No sign-up required</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">Inspect an affiliate link&apos;s <span className="text-gradient">redirect path</span></h1>
          <p className="text-lg text-slate-400 leading-relaxed">Paste any URL to inspect its HTTP status, redirects, and standard tracking parameters. This is a header-based technical check, not a browser simulation.</p>
        </div>
        <LinkChecker />
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="font-display text-xl font-semibold text-center mb-8">What this check can tell you</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'HTTP status', desc: 'Whether an automated request reaches a success, redirect, or error response.' },
              { title: 'Redirect path', desc: 'The server-side hops from the original URL toward its final destination.' },
              { title: 'Visible parameters', desc: 'Whether common tracking parameters remain visible after redirects.' },
              { title: 'Clear limitations', desc: 'JavaScript, cookies, app browsers, and bot blocking can change real visitor behaviour.' },
            ].map((item) => <div key={item.title} className="glass-card p-5"><CheckCircle2 className="w-5 h-5 text-green-400 mb-3" /><h3 className="font-semibold text-sm mb-2">{item.title}</h3><p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p></div>)}
          </div>
        </section>
        <section className="max-w-2xl mx-auto mt-12 gradient-border p-6 text-center">
          <p className="font-semibold mb-2">One link is a useful signal, not an archive audit.</p>
          <p className="text-sm text-slate-400 mb-6">Use a free leak snapshot to review a limited public sample before deciding whether recovery work is worthwhile.</p>
          <Link href="/free-scan" className="btn-primary justify-center">Get a free leak snapshot <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
