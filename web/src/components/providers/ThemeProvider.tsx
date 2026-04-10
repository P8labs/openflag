import { useEffect, type ReactNode } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light" as const;
  }

  const saved = window.localStorage.getItem("openflag-theme");
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const theme = getInitialTheme();
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, []);

  return <>{children}</>;
}
