import { SkeletonStatCards, SkeletonTable } from '@/components/dashboard/skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-40 rounded bg-white/5 animate-pulse" />
      <SkeletonStatCards count={4} />
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/5 mb-4" />
        <div className="h-64 rounded bg-white/5" />
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}
