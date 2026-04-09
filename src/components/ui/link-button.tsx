import type { ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

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
    variant === "primary" ? "ui-button-primary" : "ui-button-ghost";

  const nextClassName = [
    variantClass,
    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={nextClassName} {...props}>
      {children}
    </Link>
  );
}
