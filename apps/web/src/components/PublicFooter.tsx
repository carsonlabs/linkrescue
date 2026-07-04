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
            <Link href="/api-landing" className="hover:text-white transition-colors">API</Link>
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
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="text-slate-500">Compare</span>
          <Link href="/vs/amz-watcher" className="hover:text-white transition-colors">vs AMZ Watcher</Link>
          <Link href="/vs/affilimate" className="hover:text-white transition-colors">vs Affilimate</Link>
          <Link href="/vs/lasso" className="hover:text-white transition-colors">vs Lasso</Link>
          <Link href="/vs/dr-link-check" className="hover:text-white transition-colors">vs Dr. Link Check</Link>
          <span className="text-slate-500 md:ml-4">Check your links</span>
          <Link href="/check/amazon" className="hover:text-white transition-colors">Amazon</Link>
          <Link href="/check/shareasale" className="hover:text-white transition-colors">ShareASale</Link>
          <Link href="/check/cj" className="hover:text-white transition-colors">CJ</Link>
          <Link href="/check/impact" className="hover:text-white transition-colors">Impact</Link>
          <Link href="/check/awin" className="hover:text-white transition-colors">Awin</Link>
          <Link href="/check/rakuten-advertising" className="hover:text-white transition-colors">Rakuten</Link>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="text-slate-500">More from Freedom Engineers</span>
          <a href="https://yorklivingcost.ca" className="hover:text-white transition-colors">YorkLivingCost</a>
          <a href="https://agentready.tools" className="hover:text-white transition-colors">AgentReady</a>
          <a href="https://selfheal.dev" className="hover:text-white transition-colors">SelfHeal</a>
          <a href="https://freedomengineers.tech" className="hover:text-white transition-colors">Freedom Engineers</a>
        </div>
      </div>
    </footer>
  );
}
