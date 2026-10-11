"use client";

import { useEffect, useState } from "react";
import { ChartNoAxesCombined, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { POSTHOG_MESSAGE } from "@/lib/posthog/config";
import type { PosthogConnectionStatus } from "@/lib/db/schema/posthog-connection";

const resultKey = "ff-posthog-result";

export function PosthogConnect({
  onConnectedChange,
  readOnly = false,
  embedded = false,
}: {
  onConnectedChange?: (connected: boolean) => void;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const [status, setStatus] = useState<PosthogConnectionStatus | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(resultKey);
    sessionStorage.removeItem(resultKey);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { error?: unknown };
        if (typeof parsed.error === "string" && parsed.error) {
          const message = parsed.error;
          queueMicrotask(() => {
            setError(message);
            notify.error(message);
          });
        }
      } catch {
        // Ignore invalid session storage data.
      }
    }

    let cancelled = false;
    fetch("/api/posthog/connection")
      .then(async (response) => {
        const body = (await response.json()) as PosthogConnectionStatus & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error || "Could not load PostHog.");
        return body;
      })
      .then((next) => {
        if (cancelled) return;
        setStatus(next);
        onConnectedChange?.(next.connected);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setStatus({ connected: false });
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load PostHog.",
        );
        onConnectedChange?.(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onConnectedChange]);

  function connect() {
    setError("");
    const popup = window.open(
      "/api/posthog/connect",
      "friction-fixer-posthog",
      "popup,width=980,height=760",
    );
    if (!popup) {
      window.location.assign(
        new URL("/api/posthog/connect", window.location.href),
      );
      return;
    }
    setAuthorizing(true);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== popup) return;
      if (!event.data || event.data.type !== POSTHOG_MESSAGE) return;
      cleanup();
      if (typeof event.data.error === "string" && event.data.error) {
        setError(event.data.error);
        notify.error(event.data.error);
        return;
      }
      setStatus(null);
      refresh(true);
    };
    const timer = window.setInterval(() => {
      if (popup.closed) cleanup();
    }, 400);
    function cleanup() {
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
      setAuthorizing(false);
    }
    window.addEventListener("message", onMessage);
  }

  function refresh(announce = false) {
    fetch("/api/posthog/connection")
      .then(async (response) => {
        const body = (await response.json()) as PosthogConnectionStatus & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error || "Could not load PostHog.");
        setStatus(body);
        onConnectedChange?.(body.connected);
        if (announce && body.connected) {
          notify.success("PostHog connected.", {
            description: body.projectName,
          });
        }
      })
      .catch((loadError) => {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Could not load PostHog.";
        setError(message);
        if (announce) notify.error(message);
      });
  }

  async function disconnect() {
    setError("");
    setDisconnecting(true);
    try {
      const response = await fetch("/api/posthog/connection", {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(body.error || "Could not disconnect PostHog.");
      setStatus({ connected: false });
      onConnectedChange?.(false);
      notify.success("PostHog disconnected.");
    } catch (disconnectError) {
      const message =
        disconnectError instanceof Error
          ? disconnectError.message
          : "Could not disconnect PostHog.";
      setError(message);
      notify.error(message);
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = status?.connected === true;

  return (
    <div className={embedded ? "grid" : "grid gap-3"}>
      <div
        className={
          embedded
            ? "flex items-start justify-between gap-3 border-b px-4 py-3.5"
            : "flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
        }
      >
        <div className={embedded ? "grid min-w-0 gap-1" : "flex min-w-0 items-center gap-3"}>
          {embedded ? null : (
            <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted">
              <ChartNoAxesCombined size={18} />
            </span>
          )}
          <div className="grid min-w-0 gap-1">
            <span className="text-sm">PostHog</span>
            <span className="truncate text-xs text-muted-foreground">
              {connected
                ? status.projectName
                : status
                  ? readOnly
                    ? "Not connected."
                    : "Connect a project to read visitor data."
                  : "Checking the connection…"}
            </span>
          </div>
        </div>
        {connected ? (
          embedded ? (
            <Badge>Connected</Badge>
          ) : (
            <span className="flex shrink-0 items-center gap-2 text-xs">
              <Check size={14} />
              Connected
            </span>
          )
        ) : readOnly ? (
          embedded ? (
            <Badge variant="outline">Not connected</Badge>
          ) : null
        ) : (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={authorizing || !status}
            onClick={connect}
          >
            {authorizing ? "Connecting…" : "Connect"}
          </Button>
        )}
      </div>
      {connected && !readOnly ? (
        <Button
          type="button"
          variant="ghost"
          className="w-fit cursor-pointer"
          disabled={disconnecting}
          onClick={() => void disconnect()}
        >
          {disconnecting ? "Disconnecting…" : "Disconnect PostHog"}
        </Button>
      ) : null}
      {error ? (
        <p
          className={
            embedded
              ? "border-b px-4 py-3 text-sm text-destructive"
              : "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
