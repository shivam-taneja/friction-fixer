import { Skeleton } from "@/components/ui/skeleton";

export function GithubConnectionSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
