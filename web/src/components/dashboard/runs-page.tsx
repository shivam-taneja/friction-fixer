"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { PageHeading } from "@/components/dashboard/page-heading";
import { useSettings } from "@/components/settings/use-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  activeRunId,
  isActiveRun,
  type RunCase,
  type RunNumbers,
  type RunRecord,
} from "@/lib/db/schema/run";
import { OnboardingStatus } from "@/lib/db/schema/user";

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
  const [open, setOpen] = useState(false);
  const [runCase, setRunCase] = useState<RunCase>("increased");
  const locked = activeRunId(runs);
  const saved = runs.find((run) => run.before);
  const onboarded = data?.status === OnboardingStatus.complete;
  const needsSetup = data?.status === OnboardingStatus.not_started;

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    async function load() {
      const response = await fetch("/api/runs");
      const body = await response.json().catch(() => null);
      if (stopped) return;
      setLoading(false);
      if (!response.ok) {
        setError(body?.error ?? "Could not load runs.");
        return;
      }
      const next = Array.isArray(body?.runs) ? (body.runs as RunRecord[]) : [];
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
  }, [locked]);

  async function start() {
    if (!onboarded) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ case: runCase }),
    });
    const body = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(body?.error ?? "Could not start the run.");
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
              disabled={loading || Boolean(locked || pending)}
              onClick={() => setOpen(true)}
              className="cursor-pointer"
            >
              Start run
            </Button>
          ) : null
        }
      />

      {error || settingsError ? (
        <p className="text-sm text-destructive">{error || settingsError}</p>
      ) : null}
      {locked ? (
        <p className="text-sm text-muted-foreground">
          A run is already in progress.{" "}
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
              {saved?.before
                ? "A previous run already saved mock numbers. This run creates a new starting set, then the after set you pick."
                : "This project has no mock numbers yet. This run creates the starting set, then the after set you pick."}
            </DialogDescription>
          </DialogHeader>
          {saved?.before ? (
            <p className="text-xs text-muted-foreground">
              Last saved
              {saved.createdAt ? ` ${when(saved.createdAt)}` : ""}:{" "}
              {numbersText(saved.before)}
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
            onClick={() => void start()}
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
        <ol>
          {runs.map((run) => (
            <li key={run.id} className="border-b border-border py-3.5">
              <Link
                href={`/dashboard/runs/${run.id}`}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="text-sm">
                  {run.case === "increased" ? "Improved" : "Worse"}
                  <span className="ml-2 text-muted-foreground">
                    {run.repository}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {label(run.status)}
                  {run.createdAt ? ` • ${when(run.createdAt)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ol>
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

function numbersText(numbers: RunNumbers) {
  return `Bounce ${Math.round(numbers.bounceRate * 100)}%. Scroll ${Math.round(numbers.scrollDepth * 100)}%. Time ${numbers.timeOnPage.toFixed(1)}s. Pricing visits ${numbers.pricingPageVisits}.`;
}

function RunsSkeleton() {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading runs">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-border py-3.5"
        >
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

function label(status: RunRecord["status"]) {
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  if (status === "kept") return "Kept";
  if (status === "undone") return "Undone";
  return "Failed";
}

function when(value: string) {
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return formatDistanceToNow(date, { addSuffix: true });
}
