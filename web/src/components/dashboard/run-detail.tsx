"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/components/ui/toast";
import {
  isActiveRun,
  runStepOrder,
  type RunRecord,
  type RunStep,
} from "@/lib/db/schema/run";
import { formatLocalTime, localCheckDetail } from "@/lib/format-local-time";
import { cn } from "@/lib/utils";

export function RunDetail({ id }: { id: string }) {
  const [run, setRun] = useState<RunRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    async function load() {
      const response = await fetch(`/api/runs/${id}`);
      const body = await response.json().catch(() => null);
      if (stopped) return;
      setLoading(false);
      if (!response.ok) {
        setError(body?.error ?? "Could not load this run.");
        return;
      }
      const next = body?.run as RunRecord;
      setRun(next);
      setError("");
      if (isActiveRun(next.status)) {
        timer = window.setTimeout(load, 2000);
      }
    }

    void load();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  async function continueRun() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/runs/${id}/continue`, {
      method: "POST",
    });
    const body = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      const message = body?.error ?? "Could not continue this run.";
      setError(message);
      notify.error(message);
      return;
    }
    setRun((current) =>
      current ? { ...current, status: "running", error: "" } : current,
    );
    notify.success("Run continued.");
  }

  const saved = new Map(run?.steps.map((step) => [step.id, step]));

  return (
    <main
      className="flex flex-1 flex-col gap-10 px-6 pt-2 pb-12 md:px-8"
      aria-busy={loading}
    >
      <div className="flex flex-col items-start gap-4">
        <PageHeading
          eyebrow={id}
          title={
            loading ? (
              <span className="inline-block h-[1em] w-56 animate-pulse rounded-md bg-muted align-middle" />
            ) : run ? (
              title(run)
            ) : (
              "Run"
            )
          }
          description={
            loading ? (
              <span className="inline-block h-4 w-72 animate-pulse rounded-md bg-muted align-middle" />
            ) : run ? (
              `${
                run.case === "live"
                  ? "PostHog"
                  : run.case === "increased"
                    ? "Improved"
                    : "Worse"
              } • ${run.repository} • ${run.branch} • ${run.sourceFolder}`
            ) : (
              "This run could not be loaded."
            )
          }
        />
        <BackToRuns />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ol>
        {runStepOrder.map((item, index) => {
          const step = saved.get(item.id);
          const state = loading ? "pending" : stepState(run, item.id, step);
          const last = index === runStepOrder.length - 1;
          return (
            <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {last ? null : (
                <span
                  className="absolute top-6 left-2.75 h-[calc(100%-12px)] w-px bg-border"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  state === "done" &&
                    "border-success bg-success text-background",
                  state === "current" &&
                    "border-foreground bg-foreground text-background",
                  (state === "pending" || state === "skipped") &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {loading ? null : state === "done" ? (
                  <Check className="size-3.5" />
                ) : state === "current" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="text-[11px] tabular-nums">{index + 1}</span>
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className={cn(
                      "text-sm",
                      state !== "done" &&
                        state !== "current" &&
                        "text-muted-foreground",
                    )}
                  >
                    {step?.title || item.title}
                  </p>
                  {loading ? (
                    <Skeleton className="h-3 w-14" />
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stepLabel(state)}
                    </span>
                  )}
                </div>
                {step?.detail ? (
                  <p className="mt-1.5 text-xs whitespace-pre-wrap text-muted-foreground">
                    {localCheckDetail(step.detail, run?.checkAfter ?? null)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {loading ? null : (
        <>
          {run?.plan ? (
            <section>
              <h2 className="text-sm font-medium">Plan</h2>
              <p className="mt-2 text-sm">{run.plan.change}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {run.plan.problem}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {run.plan.file}
              </p>
            </section>
          ) : null}

          {run?.verdict ? (
            <section>
              <h2 className="text-sm font-medium">{run.verdict.decision}</h2>
              <p className="mt-2 text-sm whitespace-pre-wrap">
                {run.verdict.reason}
              </p>
            </section>
          ) : null}

          <div className="flex flex-col gap-2 text-sm">
            <UrlLink label="Pull request" url={run?.pullRequestUrl ?? ""} />
            <UrlLink
              label="Revert pull request"
              url={run?.revertPullRequestUrl ?? ""}
            />
          </div>

          {run?.status === "measuring" && run.checkAfter ? (
            <p className="text-sm text-muted-foreground">
              The baseline is saved. PostHog will be checked after{" "}
              {formatLocalTime(run.checkAfter)}.
            </p>
          ) : null}
          {run?.status === "blocked" ? (
            <section className="grid max-w-xl gap-3">
              <p className="text-sm">{run.error}</p>
              <Button
                className="w-fit cursor-pointer"
                disabled={pending}
                onClick={() => void continueRun()}
              >
                {pending ? "Continuing" : "Continue"}
              </Button>
            </section>
          ) : run?.error ? (
            <p className="text-sm text-destructive">{run.error}</p>
          ) : null}
        </>
      )}
    </main>
  );
}

function BackToRuns() {
  return (
    <Link
      href="/dashboard/runs"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to all runs
    </Link>
  );
}

function stepState(
  run: RunRecord | null,
  id: string,
  step: RunStep | undefined,
) {
  if (step) return "done";
  if (run?.status === "blocked") return "pending";
  if (!run || !isActiveRun(run.status)) return "skipped";
  const firstMissing = runStepOrder.find(
    (item) => !run.steps.some((saved) => saved.id === item.id),
  );
  return firstMissing?.id === id ? "current" : "pending";
}

function stepLabel(state: "done" | "current" | "pending" | "skipped") {
  if (state === "done") return "Done";
  if (state === "current") return "In progress";
  if (state === "skipped") return "Skipped";
  return "Waiting";
}

function title(run: RunRecord) {
  if (run.status === "kept") return "Kept";
  if (run.status === "undone") return "Undone";
  if (run.status === "failed") return "Failed";
  if (run.status === "blocked") return "Needs you";
  if (run.status === "measuring") return "Measuring";
  if (run.status === "running") return "Running";
  return "Queued";
}

function UrlLink({ label, url }: { label: string; url: string }) {
  if (!url.startsWith("https://")) return null;
  return (
    <a className="underline" href={url} rel="noreferrer" target="_blank">
      {label}
    </a>
  );
}
