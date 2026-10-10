import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const pageContainerClass =
  "mx-auto w-[min(1140px,calc(100%-5rem))] max-md:w-[calc(100%-2.5rem)]";

type PageContainerProps = ComponentProps<"div"> & {
  as?: "div" | "section";
};

export function PageContainer({
  as: Tag = "div",
  className,
  ...props
}: PageContainerProps) {
  return <Tag className={cn(pageContainerClass, className)} {...props} />;
}
