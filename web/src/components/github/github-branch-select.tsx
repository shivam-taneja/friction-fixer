"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [query, setQuery] = useState("");
  const names = branches.includes(selection.branch)
    ? branches
    : [selection.branch, ...branches];
  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? names.filter((branch) => branch.toLowerCase().includes(normalized))
    : names;

  return (
    <div className="grid gap-2">
      <Label htmlFor="github-branch">Branch</Label>
      {loading ? (
        <Skeleton className="h-11 w-full rounded-lg" />
      ) : (
        <Select
          value={selection.branch}
          onOpenChange={(open) => {
            if (!open) setQuery("");
          }}
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
          <SelectContent
            header={
              <div className="sticky top-0 z-10 bg-popover p-1.5">
                <Input
                  value={query}
                  placeholder="Search branches"
                  aria-label="Search branches"
                  autoFocus
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                />
              </div>
            }
          >
            {visible.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No branches
              </p>
            ) : (
              visible.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                  {branch === selection.defaultBranch ? " • default" : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-muted-foreground">
        Pull requests open against this branch.
      </p>
    </div>
  );
}
