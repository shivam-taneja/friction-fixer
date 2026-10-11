"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/dashboard/page-heading";
import { GithubIcon } from "@/components/icons/github-icon";
import { PosthogConnect } from "@/components/posthog/posthog-connect";
import { useSettings } from "@/components/settings/use-settings";
import { Badge } from "@/components/ui/badge";
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
import {
  CHECK_AFTER_MAX_HOURS,
  CHECK_AFTER_MIN_HOURS,
  formatCheckAfter,
  isCheckAfterHours,
  OnboardingStatus,
} from "@/lib/db/schema/user";

export function SettingsPage() {
  const {
    data,
    error,
    loading,
    removing,
    savingMock,
    savingWait,
    removeConnection,
    setMockData,
    setCheckAfter,
  } = useSettings();
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
        <section className="overflow-hidden rounded-xl border bg-card">
          <header className="grid gap-1 border-b bg-muted px-4 py-3.5">
            <h2 className="text-sm font-semibold">Connections</h2>
            <p className="text-xs text-muted-foreground">
              Finish setup so your agent knows which analytics and repository to
              use.
            </p>
          </header>
          <div className="px-4 py-3">
            <Button
              variant="outline"
              className="w-fit"
              nativeButton={false}
              render={<Link href="/onboarding" />}
            >
              Complete onboarding
            </Button>
          </div>
        </section>
      ) : null}

      {data?.status === OnboardingStatus.complete ? (
        <div className="grid gap-4">
          <section className="overflow-hidden rounded-xl border bg-card">
            <header className="border-b bg-muted px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                  <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <GithubIcon size={14} className="text-muted-foreground" />
                    <span className="truncate">{data.project.repository}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {data.project.branch} •{" "}
                    {folderLabel(data.project.sourceFolder)}
                  </p>
                </div>
                <Badge>Current</Badge>
              </div>
            </header>
            <PosthogConnect readOnly embedded />
            <ConnectionRow
              title={frameworkLabel(data.project.framework)}
              detail={folderLabel(data.project.sourceFolder)}
            />
            <ConnectionRow
              title="Goal"
              detail={data.project.goal}
              divider={false}
            />
            <div className="border-t px-4 py-3">
              <Button
                type="button"
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setConfirmOpen(true)}
              >
                Disconnect GitHub and PostHog
              </Button>
            </div>
          </section>
          <CheckWait
            hours={data.checkAfterHours}
            saving={savingWait}
            onSave={setCheckAfter}
          />
          <section className="overflow-hidden rounded-xl border bg-card">
            <header className="flex items-start justify-between gap-3 border-b bg-muted px-4 py-3.5">
              <div className="grid gap-1">
                <h2 className="text-sm font-semibold">Mock data</h2>
                <p className="text-xs text-muted-foreground">
                  {data.useMockData
                    ? "Runs use mock numbers instead of waiting for PostHog."
                    : "A run waits until PostHog has visitor data."}
                </p>
              </div>
              <Badge variant={data.useMockData ? "default" : "outline"}>
                {data.useMockData ? "On" : "Off"}
              </Badge>
            </header>
            <div className="px-4 py-3">
              <Button
                type="button"
                variant="outline"
                className="w-fit cursor-pointer"
                disabled={savingMock}
                onClick={() => void setMockData(!data.useMockData)}
              >
                {savingMock
                  ? "Saving…"
                  : data.useMockData
                    ? "Turn off"
                    : "Turn on"}
              </Button>
            </div>
          </section>
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
        </div>
      ) : null}
    </main>
  );
}

function CheckWait({
  hours,
  saving,
  onSave,
}: {
  hours: number;
  saving: boolean;
  onSave: (hours: number) => Promise<void>;
}) {
  const [value, setValue] = useState(String(hours));
  const [syncedHours, setSyncedHours] = useState(hours);
  if (hours !== syncedHours) {
    setSyncedHours(hours);
    setValue(String(hours));
  }

  const parsed = Number(value);
  const valid = isCheckAfterHours(parsed);
  const unchanged = valid && parsed === hours;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="grid gap-1 border-b bg-muted px-4 py-3.5">
        <h2 className="text-sm font-semibold">Check wait</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          After a live change is merged, PostHog is read again this many hours
          later. The shortest wait is 1 hour. The longest is 14 days. A run that
          is already scheduled keeps its current check time.
        </p>
      </header>
      <form
        className="grid gap-3 px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid || unchanged || saving) return;
          void onSave(parsed);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="check-after-hours">Hours</Label>
          <div className="flex items-center gap-3">
            <Input
              id="check-after-hours"
              className="w-28"
              type="number"
              inputMode="numeric"
              min={CHECK_AFTER_MIN_HOURS}
              max={CHECK_AFTER_MAX_HOURS}
              step={1}
              value={value}
              disabled={saving}
              onChange={(event) => setValue(event.target.value)}
            />
            <span className="text-sm text-muted-foreground">
              {valid ? formatCheckAfter(parsed) : "1 hour to 14 days"}
            </span>
          </div>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="w-fit cursor-pointer"
          disabled={saving || !valid || unchanged}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </section>
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
          <DialogTitle>Disconnect GitHub and PostHog</DialogTitle>
          <DialogDescription>
            This disconnects GitHub and PostHog together and deletes the
            project. Any run still going for this project will be stopped, and
            you will not be able to continue it. Type{" "}
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
            {removing ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionRow({
  title,
  detail,
  divider = true,
}: {
  title: string;
  detail: string;
  divider?: boolean;
}) {
  return (
    <div className={`grid gap-1 px-4 py-3.5 ${divider ? "border-b" : ""}`}>
      <span className="text-sm">{title}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading settings">
      <div className="overflow-hidden rounded-xl border">
        <div className="grid gap-2 border-b bg-muted px-4 py-3.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 border-b px-4 py-3.5"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border">
        <div className="grid gap-2 border-b bg-muted px-4 py-3.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="px-4 py-3.5">
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
