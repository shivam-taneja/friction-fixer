"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { toast as sonner, Toaster as Sonner, type ExternalToast } from "sonner";

const toastClass =
  "flex w-[var(--width)] items-start gap-3 rounded-lg border bg-background px-3.5 py-3 font-sans text-sm text-foreground shadow-float";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      gap={8}
      offset={16}
      visibleToasts={3}
      icons={{
        error: <CircleAlert className="size-4 shrink-0 text-destructive" />,
        success: <CircleCheck className="size-4 shrink-0 text-success" />,
      }}
      toastOptions={{
        unstyled: true,
        duration: 7000,
        classNames: {
          toast: toastClass,
          content: "grid min-w-0 flex-1 gap-1",
          title: "text-left text-sm leading-5 font-medium whitespace-normal",
          description:
            "text-left text-xs leading-5 whitespace-normal text-muted-foreground",
          icon: "mt-0.5",
          error: "border-destructive/30",
          success: "border-success/30",
          actionButton:
            "shrink-0 cursor-pointer rounded-md bg-secondary px-2 py-1 text-xs font-medium text-foreground",
        },
      }}
    />
  );
}

type Notice = {
  description?: string;
  action?: { label: string; onClick: () => void };
};

function options(notice?: Notice): ExternalToast {
  return {
    description: notice?.description,
    action: notice?.action,
  };
}

export const notify = {
  error(message: string, notice?: Notice) {
    return sonner.error(message, options(notice));
  },
  success(message: string, notice?: Notice) {
    return sonner.success(message, options(notice));
  },
  message(message: string, notice?: Notice) {
    return sonner.message(message, options(notice));
  },
};
