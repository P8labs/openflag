import type { ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

type UiLinkButtonProps = LinkProps & {
  className?: string;
  children: ReactNode;
  variant?: "ghost" | "primary";
};

export function UiLinkButton({
  className,
  children,
  variant = "ghost",
  ...props
}: UiLinkButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-border bg-background text-foreground hover:bg-muted";

  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-xs px-4 py-2 text-sm font-medium transition-colors",
        variantClass,
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
