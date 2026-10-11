"use client";

import { useEffect, useEffectEvent, useState } from "react";
import {
  folderLabel,
  frameworkChoices,
  frameworkLabel,
  type FrameworkId,
  type ProjectPreset,
} from "@/lib/github/framework";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  messageFrom,
  readJson,
} from "@/components/github/github-connection-helpers";

export function GithubProjectSetup({
  fullName,
  branch,
  onResolved,
}: {
  fullName: string;
  branch: string;
  onResolved: (value: { framework: FrameworkId; sourceFolder: string }) => void;
}) {
  const [preset, setPreset] = useState<ProjectPreset | null>(null);
  const [framework, setFramework] = useState<FrameworkId | null>(null);
  const [folder, setFolder] = useState(defaultFolderValue);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportResolved = useEffectEvent(onResolved);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({ repo: fullName, branch });
    readJson<ProjectPreset>(`/api/github/project?${params.toString()}`)
      .then((next) => {
        if (cancelled) return;
        setPreset(next);
        setFramework(next.framework);
        setFolder(defaultFolderValue);
        setLoading(false);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setPreset(null);
        setFramework(null);
        setError(messageFrom(loadError));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [branch, fullName]);

  const detected = preset?.framework ?? null;
  const defaultFolder = framework && preset ? preset.defaults[framework] : "";
  const found = framework && preset ? preset.defaultFound[framework] : false;
  const usingDefault = folder === defaultFolderValue;
  const resolved = usingDefault ? (found ? defaultFolder : "") : folder;

  useEffect(() => {
    if (!framework) return;
    reportResolved({ framework, sourceFolder: resolved });
  }, [framework, resolved]);

  if (loading) {
    return (
      <div className="grid gap-5" aria-busy="true">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!preset || !framework) {
    return error ? (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    ) : null;
  }

  const normalized = query.trim().toLowerCase();
  const visibleFolders = preset.folders.filter((path) => {
    if (!normalized) return true;
    return folderLabel(path).toLowerCase().includes(normalized);
  });
  const showDefault =
    !normalized ||
    "default".includes(normalized) ||
    folderLabel(defaultFolder).toLowerCase().includes(normalized);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="github-framework">Framework preset</Label>
        <Select
          value={framework}
          onValueChange={(value) => {
            if (!value || !isChoice(value)) return;
            setFramework(value);
            setFolder(defaultFolderValue);
          }}
        >
          <SelectTrigger id="github-framework" className="h-11 w-full">
            <SelectValue placeholder="Framework">
              {frameworkLabel(framework)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {frameworkChoices.map((choice) => (
              <SelectItem key={choice.id} value={choice.id}>
                {choice.label}
                {choice.id === detected ? " · detected" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {framework === detected
            ? "Detected from this repository."
            : "You changed the detected preset."}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="github-folder">Main source folder</Label>
        <Select
          value={usingDefault ? defaultFolderValue : folder}
          onOpenChange={(open) => {
            if (!open) setQuery("");
          }}
          onValueChange={(value) => {
            if (!value) return;
            setFolder(value);
          }}
        >
          <SelectTrigger id="github-folder" className="h-11 w-full">
            <SelectValue placeholder="Choose a folder">
              {usingDefault
                ? `Default · ${folderLabel(defaultFolder)}`
                : folderLabel(folder)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            header={
              <div className="sticky top-0 z-10 bg-popover p-1.5">
                <Input
                  value={query}
                  placeholder="Search folders"
                  aria-label="Search folders"
                  autoFocus
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                />
              </div>
            }
          >
            {showDefault ? (
              <SelectItem value={defaultFolderValue}>
                Default · {folderLabel(defaultFolder)}
              </SelectItem>
            ) : null}
            {visibleFolders.length === 0 && !showDefault ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No folders
              </p>
            ) : (
              visibleFolders.map((path) => (
                <SelectItem key={path} value={path}>
                  {folderLabel(path)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {usingDefault
            ? found
              ? `Default for ${frameworkLabel(framework)} is ${folderLabel(defaultFolder)}.`
              : `No ${frameworkLabel(framework)} source folder was found. Pick one from the repository.`
            : "The agent works in this folder."}
        </p>
      </div>
    </div>
  );
}

const defaultFolderValue = "__default__";

function isChoice(value: string): value is FrameworkId {
  return frameworkChoices.some((choice) => choice.id === value);
}
