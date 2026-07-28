import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountsSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-800/60">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="ui-card p-4 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ui-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
