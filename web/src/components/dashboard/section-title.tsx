import type { ReactNode } from "react";

export function SectionTitle({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {action ??
        (meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null)}
    </div>
  );
}
