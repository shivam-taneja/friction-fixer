"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthCta({
  signedOutLabel,
  variant,
  size,
  className,
}: {
  signedOutLabel: string;
  variant: "ink" | "hero";
  size?: "lg";
  className?: string;
}) {
  const signedIn = false;

  return (
    <Button
      nativeButton={false}
      render={<Link href={signedIn ? "/dashboard" : "/auth"} />}
      variant={variant}
      size={size}
      className={className}
    >
      {signedIn ? "Go to dashboard" : signedOutLabel} <ArrowUpRight />
    </Button>
  );
}
