import Link from 'next/link';
import { TrendingDown, ArrowRight } from 'lucide-react';

export function CalculatorTeaser() {
  return (
    <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <TrendingDown className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm mb-1">
            A working link can still lose its affiliate attribution during a redirect
          </p>
          <p className="text-xs text-slate-400">
            Use your own traffic and conversion assumptions to create a planning estimate in 30 seconds.
          </p>
        </div>
      </div>
      <Link
        href="/affiliate-link-revenue-calculator"
        className="btn-primary whitespace-nowrap text-sm flex-shrink-0"
      >
        Build an estimate
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
