import { SkeletonStatCards } from '@/components/dashboard/skeleton';

export default function TrendsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 rounded bg-white/5 animate-pulse" />
      <SkeletonStatCards count={3} />
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 w-40 rounded bg-white/5 mb-4" />
        <div className="h-72 rounded bg-white/5" />
      </div>
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 w-36 rounded bg-white/5 mb-4" />
        <div className="h-48 rounded bg-white/5" />
      </div>
    </div>
  );
}
