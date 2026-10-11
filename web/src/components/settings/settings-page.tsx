"use client";

import { useState, type ReactNode } from "react";
import { ChartNoAxesCombined, Check } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/dashboard/page-heading";
import { SectionTitle } from "@/components/dashboard/section-title";
import { GithubIcon } from "@/components/icons/github-icon";
import { analyticsLabel } from "@/components/onboarding/logic";
import { useSettings } from "@/components/settings/use-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { folderLabel, frameworkLabel } from "@/lib/github/framework";
import { OnboardingStatus } from "@/lib/db/schema/user";

export function SettingsPage() {
  const { data, error, loading, removing, removeConnection } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 pt-2 pb-12 md:px-8">
      <PageHeading
        eyebrow="YOUR AGENT, ON YOUR TERMS"
        title="Keep it in your control."
        description="Your website, connections, and preferences."
      />

      {loading ? <SettingsSkeleton /> : null}

      {error && !confirmOpen ? (
        <p
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {data?.status === OnboardingStatus.not_started ? (
        <section className="grid max-w-xl gap-4 rounded-lg border px-4 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Connections</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish setup so your agent knows which analytics and repository to
              use.
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

      {data?.status === OnboardingStatus.complete ? (
        <section className="grid max-w-xl gap-4">
          <SectionTitle title="Connections" />
          <div className="divide-y rounded-lg border">
            <ConnectionRow
              icon={<ChartNoAxesCombined size={18} />}
              title={analyticsLabel(data.project.analyticsProvider)}
              detail="Visitor analytics"
            />
            <ConnectionRow
              icon={<GithubIcon size={18} />}
              title="GitHub"
              detail={`${data.project.repository} • ${data.project.branch}`}
            />
            <ConnectionRow
              icon={null}
              title={frameworkLabel(data.project.framework)}
              detail={folderLabel(data.project.sourceFolder)}
            />
            <ConnectionRow
              icon={null}
              title="Goal"
              detail={data.project.goal}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            className="w-fit cursor-pointer"
            onClick={() => setConfirmOpen(true)}
          >
            Remove connection
          </Button>
          <RemoveConnectionDialog
            repository={data.project.repository}
            open={confirmOpen}
            removing={removing}
            error={error}
            onOpenChange={setConfirmOpen}
            onConfirm={async () => {
              const removed = await removeConnection(data.project.repository);
              if (removed) setConfirmOpen(false);
            }}
          />
        </section>
      ) : null}
    </main>
  );
}

function RemoveConnectionDialog({
  repository,
  open,
  removing,
  error,
  onOpenChange,
  onConfirm,
}: {
  repository: string;
  open: boolean;
  removing: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const confirmed = value.trim() === repository;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (removing) return;
        if (!next) setValue("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove connection</DialogTitle>
          <DialogDescription>
            This deletes the project and uninstalls the GitHub app. Type{" "}
            <span className="font-medium text-foreground">{repository}</span> to
            confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="confirm-repository">Repository</Label>
          <Input
            id="confirm-repository"
            value={value}
            autoComplete="off"
            placeholder={repository}
            disabled={removing}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={removing}
            onClick={() => {
              setValue("");
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer"
            disabled={!confirmed || removing}
            onClick={() => void onConfirm()}
          >
            {removing ? "Removing…" : "Remove connection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionRow({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <strong className="block truncate text-sm font-semibold">
            {title}
          </strong>
          <small className="block truncate text-xs text-muted-foreground">
            {detail}
          </small>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-2 text-xs text-success">
        <Check size={14} />
        Selected
      </span>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid max-w-xl gap-3" aria-busy="true">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}
