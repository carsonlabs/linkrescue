import { SkeletonCard } from '@/components/dashboard/skeleton';

export default function SitesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-white/5 animate-pulse" />
        <div className="h-10 w-28 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}
