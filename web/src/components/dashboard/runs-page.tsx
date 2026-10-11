"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { PageHeading } from "@/components/dashboard/page-heading";
import { useSettings } from "@/components/settings/use-settings";
import { GithubIcon } from "@/components/icons/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { folderLabel } from "@/lib/github/framework";
import {
  activeRunId,
  groupRuns,
  isActiveRun,
  startingNumbers,
  type RunCase,
  type RunGroup,
  type RunNumbers,
  type RunRecord,
} from "@/lib/db/schema/run";
import { OnboardingStatus } from "@/lib/db/schema/user";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";

type RunsResponse = {
  runs?: RunRecord[];
  error?: string;
};

export function RunsPage() {
  const router = useRouter();
  const {
    data,
    error: settingsError,
    loading: settingsLoading,
  } = useSettings();
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const [runCase, setRunCase] = useState<RunCase>("increased");
  const currentProject =
    data?.status === OnboardingStatus.complete
      ? { id: data.project.id, createdAt: data.project.createdAt }
      : null;
  const groups = groupRuns(runs, currentProject);
  const locked = activeRunId(runs);
  const waiting = runs.find(
    (run) => run.id === locked && run.status === "blocked",
  );
  const measuring = runs.find(
    (run) => run.id === locked && run.status === "measuring",
  );
  const starting = startingNumbers(runs, currentProject?.id ?? "");
  const onboarded = data?.status === OnboardingStatus.complete;
  const needsSetup = data?.status === OnboardingStatus.not_started;

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    async function load() {
      const response = await fetch("/api/runs");
      const body = (await response
        .json()
        .catch(() => null)) as RunsResponse | null;
      if (stopped) return;
      setLoading(false);
      if (!response.ok) {
        setError(body?.error ?? "Could not load runs.");
        return;
      }
      const next = Array.isArray(body?.runs) ? body.runs : [];
      setRuns(next);
      setError("");
      if (next.some((run) => isActiveRun(run.status))) {
        timer = window.setTimeout(load, 2000);
      }
    }

    void load();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  async function openStart() {
    if (!onboarded || locked) return;
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/readiness");
      const body = (await response.json().catch(() => null)) as {
        ready?: boolean;
        mock?: boolean;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error || "Could not check the baseline.");
      }
      if (body?.ready !== true) {
        notify.error(
          body?.error ||
            "This project needs a baseline before a run can start. Wait until PostHog has visitor data, or turn on mock data in Settings.",
          {
            action: {
              label: "Settings",
              onClick: () => router.push("/dashboard/settings"),
            },
          },
        );
        return;
      }
      if (body.mock === true) {
        setOpen(true);
        return;
      }
      await start("live");
    } catch (loadError) {
      notify.error(
        loadError instanceof Error
          ? loadError.message
          : "Could not check the baseline.",
        {
          action: {
            label: "Settings",
            onClick: () => router.push("/dashboard/settings"),
          },
        },
      );
    } finally {
      setChecking(false);
    }
  }

  async function start(chosen: RunCase) {
    if (!onboarded) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ case: chosen }),
    });
    const body = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      const message = body?.error ?? "Could not start the run.";
      setError(message);
      notify.error(message);
      if (
        response.status !== 429 &&
        typeof body?.runId === "string" &&
        body.runId
      ) {
        router.push(`/dashboard/runs/${body.runId}`);
      }
      return;
    }
    router.push(`/dashboard/runs/${body.id}`);
  }

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 pt-2 pb-12 md:px-8">
      <PageHeading
        eyebrow="ONE RUN AT A TIME"
        title="Runs"
        description="Start a round, follow each step, and come back to what the agent saved."
        action={
          settingsLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : onboarded ? (
            <Button
              disabled={loading || Boolean(locked || pending || checking)}
              onClick={() => void openStart()}
              className="cursor-pointer"
            >
              {checking ? "Checking" : "Start run"}
            </Button>
          ) : null
        }
      />

      {error || settingsError ? (
        <p className="text-sm text-destructive">{error || settingsError}</p>
      ) : null}
      {locked ? (
        <p className="text-sm text-muted-foreground">
          {measuring
            ? `A change is live. PostHog will be checked ${
                measuring.checkAfter ? when(measuring.checkAfter) : "later"
              }. `
            : waiting
              ? "A run is waiting for you to resolve a pull request. "
              : "A run is already in progress. "}
          <Link
            className="text-foreground underline"
            href={`/dashboard/runs/${locked}`}
          >
            Open it
          </Link>
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start run</DialogTitle>
            <DialogDescription>
              {starting
                ? "This run uses your latest saved mock numbers as the baseline, then creates new numbers for the outcome you choose."
                : "No mock numbers are saved yet. This run creates a baseline, then new numbers for the outcome you choose."}
            </DialogDescription>
          </DialogHeader>
          {starting ? (
            <p className="text-xs text-muted-foreground">
              Latest saved: {numbersText(starting)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved mock numbers.
            </p>
          )}
          <div className="grid gap-2">
            <Choice
              selected={runCase === "increased"}
              title="Improved"
              detail="After the edit, pretend the goal was achieved."
              onSelect={() => setRunCase("increased")}
            />
            <Choice
              selected={runCase === "decreased"}
              title="Worse"
              detail="After the edit, pretend the goal was missed."
              onSelect={() => setRunCase("decreased")}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            className="cursor-pointer"
            disabled={pending}
            onClick={() => void start(runCase)}
          >
            {pending ? "Starting" : "Start"}
          </Button>
        </DialogContent>
      </Dialog>

      {needsSetup ? (
        <section className="grid max-w-xl gap-4 rounded-lg border px-4 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Finish setup</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete onboarding before starting a run, so the agent knows
              which analytics and repository to use.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-fit"
            nativeButton={false}
            render={<Link href="/onboarding" />}
          >
            Complete onboarding
          </Button>
        </section>
      ) : null}

      {loading ? (
        <RunsSkeleton />
      ) : runs.length === 0 ? (
        needsSetup ? null : (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        )
      ) : (
        <div className="grid gap-4">
          {onboarded && !groups.some((group) => group.current) ? (
            <p className="text-sm text-muted-foreground">
              No runs for this project yet.
            </p>
          ) : null}
          {groups.map((group) => (
            <ProjectRuns key={group.projectId} group={group} />
          ))}
        </div>
      )}
    </main>
  );
}

function Choice({
  selected,
  title,
  detail,
  onSelect,
}: {
  selected: boolean;
  title: string;
  detail: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-lg border px-3 py-2 text-left cursor-pointer ${
        selected ? "border-foreground" : "border-border"
      }`}
    >
      <span className="block text-sm">{title}</span>
      <span className="block text-xs text-muted-foreground">{detail}</span>
    </button>
  );
}

function ProjectRuns({ group }: { group: RunGroup }) {
  const [page, setPage] = useState(1);
  const paged = paginate(group.runs, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="grid gap-2 border-b bg-muted px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <GithubIcon size={14} className="text-muted-foreground" />
              <span className="truncate">{group.repository}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {[
                group.branch,
                folderLabel(group.sourceFolder || "."),
                group.connectedAt ? `Connected ${when(group.connectedAt)}` : "",
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>
          <Badge variant={group.current ? "default" : "outline"}>
            {group.current ? "Current" : "Disconnected"}
          </Badge>
        </div>
        {group.current ? null : (
          <p className="text-xs leading-relaxed text-foreground">
            This project was disconnected. These runs cannot be continued.
          </p>
        )}
      </header>
      <ol>
        {paged.items.map((run) => (
          <li key={run.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/dashboard/runs/${run.id}`}
              className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-muted/40"
            >
              <span className="text-sm">{label(run.status)}</span>
              <span className="text-xs text-muted-foreground">
                {outcomeLabel(run)}
                {run.createdAt ? ` • ${when(run.createdAt)}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Pagination
        page={paged.page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={group.runs.length}
        onPageChange={setPage}
        label={`${group.repository} runs`}
        className="border-t px-4 py-3"
      />
    </section>
  );
}

function numbersText(numbers: RunNumbers) {
  return `Bounce ${Math.round(numbers.bounceRate * 100)}%. Scroll ${Math.round(numbers.scrollDepth * 100)}%. Time ${numbers.timeOnPage.toFixed(1)}s. Pricing visits ${numbers.pricingPageVisits}.`;
}

function RunsSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading runs">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border">
          <div className="grid gap-2 border-b bg-muted px-4 py-3.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          {Array.from({ length: 2 }, (_, row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 border-b px-4 py-3.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function outcomeLabel(run: RunRecord) {
  if (run.case === "live") {
    return run.status === "measuring" && run.checkAfter
      ? `PostHog • check ${when(run.checkAfter)}`
      : "PostHog";
  }
  return run.case === "increased" ? "Improved" : "Worse";
}

function label(status: RunRecord["status"]) {
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  if (status === "kept") return "Kept";
  if (status === "undone") return "Undone";
  if (status === "blocked") return "Needs you";
  if (status === "measuring") return "Measuring";
  return "Failed";
}

function when(value: string) {
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return formatDistanceToNow(date, { addSuffix: true });
}
