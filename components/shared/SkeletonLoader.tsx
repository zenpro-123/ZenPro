import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/shared/GlassCard";

/** Skeleton for a standard content card (article, repo, opportunity, etc.) */
export function CardSkeleton() {
  return (
    <GlassCard static className="p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/** Grid of card skeletons — use while a module's data is loading. */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for the Good Morning hero section. */
export function HeroSkeleton() {
  return (
    <GlassCard static strong className="p-8">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-9 w-2/3 mb-6" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </GlassCard>
  );
}

/** Skeleton row for ticker / market widgets. */
export function TickerSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-36 rounded-xl shrink-0" />
      ))}
    </div>
  );
}
