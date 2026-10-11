import { Check } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function GithubStep({
  repo,
  onRepoChange,
}: {
  repo: string;
  onRepoChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <label className="grid text-sm font-medium">
        <span className="flex items-center gap-2">
          <GithubIcon size={15} />
          GitHub repository
        </span>
        <input
          autoFocus
          className={inputClass}
          placeholder="your-team/website"
          value={repo}
          onChange={(event) => onRepoChange(event.target.value)}
        />
        <span className="mt-2 text-xs font-normal text-muted-foreground">
          Use the repository that powers this website.
        </span>
      </label>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">
            Review changes before they go live
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You approve. The agent measures.
          </p>
        </div>
        <Check size={18} className="shrink-0 text-success" />
      </div>
    </div>
  );
}
