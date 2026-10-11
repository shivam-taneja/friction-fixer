import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GithubSelection } from "@/lib/github/types";

export function GithubBranchSelect({
  selection,
  branches,
  loading,
  onBranchChange,
}: {
  selection: GithubSelection;
  branches: string[];
  loading: boolean;
  onBranchChange: (branch: string) => void;
}) {
  const names = branches.includes(selection.branch)
    ? branches
    : [selection.branch, ...branches];

  return (
    <div className="grid gap-2">
      <Label htmlFor="github-branch">Branch</Label>
      <Select
        value={selection.branch}
        onValueChange={(branch) => {
          if (!branch) return;
          onBranchChange(branch);
        }}
      >
        <SelectTrigger id="github-branch" className="h-11 w-full">
          <SelectValue placeholder="Choose a branch">
            {selection.branch}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {names.map((branch) => (
            <SelectItem key={branch} value={branch}>
              {branch}
              {branch === selection.defaultBranch ? " · default" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {loading
          ? "Loading branches…"
          : "Pull requests open against this branch."}
      </p>
    </div>
  );
}
