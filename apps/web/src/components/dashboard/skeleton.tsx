export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-white/5 mb-2" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/5 mb-2"
          style={{ width: `${80 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-white/5 bg-white/5">
        <div className="h-3 w-48 rounded bg-white/5" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-white/5 flex items-center gap-4">
          <div className="h-3 w-24 rounded bg-white/5" />
          <div className="h-3 w-16 rounded bg-white/5" />
          <div className="flex-1" />
          <div className="h-3 w-12 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 animate-pulse">
          <div className="h-3 w-16 rounded bg-white/5 mb-3" />
          <div className="h-7 w-20 rounded bg-white/5 mb-1" />
          <div className="h-3 w-24 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
