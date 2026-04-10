import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type ThemeToggleVariant = "icon" | "label";

type ThemeToggleProps = {
  variant?: ThemeToggleVariant;
};

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("openflag-theme");
    const initialTheme = (
      saved === "dark" || saved === "light" ? saved : "light"
    ) as "light" | "dark";
    setTheme(initialTheme);
  }, []);

  const handleToggle = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    const root = document.documentElement;
    root.classList.toggle("dark", newTheme === "dark");
    window.localStorage.setItem("openflag-theme", newTheme);
  };

  const nextTheme = theme === "dark" ? "light" : "dark";

  const label = theme === "dark" ? "Light theme" : "Dark theme";

  if (variant === "label") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              className="rounded-md border border-transparent w-full"
              onClick={() => handleToggle(nextTheme)}
              aria-label={`Switch to ${nextTheme} theme`}
            >
              <div
                className={cn(
                  "flex size-11 h-10 justify-start gap-3 rounded-lg border transition-colors",
                  "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {theme === "dark" ? (
                  <Sun className="size-5 shrink-0" />
                ) : (
                  <Moon className="size-5 shrink-0" />
                )}
                <span className={"hidden lg:inline text-sm font-medium"}>
                  {label}
                </span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="rounded-full hover:bg-accent"
            onClick={() => handleToggle(nextTheme)}
            aria-label={`Switch to ${nextTheme} theme`}
          >
            {theme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
