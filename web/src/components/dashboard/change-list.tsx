import { Check, GitPullRequest, RotateCcw } from "lucide-react";
import { changes, type ChangeStatus } from "@/components/dashboard/workspace";
import { cn } from "@/lib/utils";

const statusIcon = {
  Review: GitPullRequest,
  Kept: Check,
  Reverted: RotateCcw,
} as const;

const statusClass: Record<ChangeStatus, string> = {
  Review: "text-signal",
  Kept: "text-success",
  Reverted: "text-muted-foreground",
};

export function ChangeList({ limit }: { limit?: number }) {
  const items = typeof limit === "number" ? changes.slice(0, limit) : changes;

  return (
    <ul className="mt-2">
      {items.map((change) => {
        const Icon = statusIcon[change.status];

        return (
          <li
            key={change.id}
            className="flex items-center gap-3 border-b border-border py-4"
          >
            <Icon
              className={cn("size-4 shrink-0", statusClass[change.status])}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{change.title}</p>
              <p className="text-xs text-muted-foreground">
                {change.page} · Pull request #{change.pullRequest}
                {change.note ? ` · ${change.note}` : ""}
              </p>
            </div>
            <span className={cn("text-xs", statusClass[change.status])}>
              {change.status}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
