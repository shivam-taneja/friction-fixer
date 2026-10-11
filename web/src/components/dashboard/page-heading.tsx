import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-[650] tracking-[1.5px] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[2rem] leading-tight font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
