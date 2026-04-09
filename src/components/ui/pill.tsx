import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type UiPillProps = {
  children: ReactNode;
  className?: string;
};

export function UiPill({ children, className }: UiPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
