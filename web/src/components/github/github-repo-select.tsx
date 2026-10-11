"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GithubRepoOption, GithubSelection } from "@/lib/github/types";

export function GithubRepoSelect({
  repos,
  installationId,
  selection,
  onSelectionChange,
}: {
  repos: GithubRepoOption[];
  installationId: number;
  selection: GithubSelection | null;
  onSelectionChange: (value: GithubSelection) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = repos.find((repo) => repo.fullName === selection?.fullName);
  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? repos.filter((repo) => repo.fullName.toLowerCase().includes(normalized))
    : repos;

  return (
    <div className="grid gap-2">
      <Label htmlFor="github-repo">Repository</Label>
      <Select
        value={selection?.fullName ?? null}
        onOpenChange={(open) => {
          if (!open) setQuery("");
        }}
        onValueChange={(value) => {
          if (!value) return;
          const repo = repos.find((item) => item.fullName === value);
          if (!repo) return;
          onSelectionChange({
            installationId,
            fullName: repo.fullName,
            defaultBranch: repo.defaultBranch,
            branch: repo.defaultBranch,
          });
        }}
      >
        <SelectTrigger id="github-repo" className="h-11 w-full">
          <SelectValue placeholder="Choose a repository">
            {selected
              ? repoLabel(selected.fullName, selected.private)
              : "Choose a repository"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          header={
            <div className="sticky top-0 z-10 bg-popover p-1.5">
              <Input
                value={query}
                placeholder="Search repositories"
                aria-label="Search repositories"
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
          }
        >
          {visible.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No repositories
            </p>
          ) : (
            visible.map((repo) => (
              <SelectItem key={repo.id} value={repo.fullName}>
                {repoLabel(repo.fullName, repo.private)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        The agent opens pull requests in this repository.
      </p>
    </div>
  );
}

function repoLabel(fullName: string, isPrivate: boolean) {
  return isPrivate ? `${fullName} (private)` : fullName;
}
