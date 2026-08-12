export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/8 rounded-md ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-paper-raised border border-black/10 rounded-lg p-4">
      <Skeleton className="w-8 h-8 rounded-md mb-3" />
      <Skeleton className="w-16 h-3 mb-2" />
      <Skeleton className="w-10 h-6" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="bg-paper-raised border border-black/10 rounded-lg p-5 flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="w-40 h-4" />
        <Skeleton className="w-24 h-3" />
      </div>
      <Skeleton className="w-20 h-7" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-14 h-7 rounded-md" />
      </div>
      <Skeleton className="w-32 h-4 mb-3" />
      <Skeleton className="w-full h-3 mb-1.5" />
      <Skeleton className="w-2/3 h-3" />
    </div>
  );
}
