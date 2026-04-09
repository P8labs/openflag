import type { ReactNode } from "react";

type UiPillProps = {
  children: ReactNode;
  className?: string;
};

export function UiPill({ children, className }: UiPillProps) {
  const nextClassName = [
    "ui-pill inline-flex items-center px-3 py-1 text-xs text-foreground/70",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={nextClassName}>{children}</span>;
}
