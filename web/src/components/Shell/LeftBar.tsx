import {
  NavLink,
  useLocation,
  type NavLinkRenderProps,
} from "react-router-dom";
import {
  Compass,
  FolderKanban,
  Home,
  Settings,
  Sparkles,
  SquarePen,
  type LucideIcon,
} from "lucide-react";

import { Button } from "../ui/button";
import { BrandLogo } from "../ui/brand-logo";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { usePostComposer } from "../posts/PostComposerProvider";

const navItems = [
  { label: "Home", to: "/app", icon: Home },
  { label: "Explore", to: "/app/explore", icon: Compass },
  { label: "Galaxy", to: "/app/galaxy", icon: Sparkles },
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
] as const;

export default function LeftBar() {
  const location = useLocation();
  const { openComposer } = usePostComposer();
  const isSettingsActive = location.pathname.startsWith("/app/settings");

  return (
    <nav className="lg:min-w-50 border rounded-l-md border-secondary bg-secondary/20 p-2 fixed md:sticky top-0 h-[calc(100vh-1rem)] overflow-hidden">
      <TooltipProvider>
        <div className="flex h-full min-h-0 flex-col justify-between">
          <div className="space-y-4 h-full overflow-y-auto pr-1">
            <div className="flex justify-center">
              <BrandLogo size="md" />
            </div>

            <div className="flex flex-col items-center lg:items-start lg:gap-1 gap-3">
              {navItems.map((item) => (
                <IconNavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                />
              ))}

              <ActionNavItem
                label="Create Post"
                icon={SquarePen}
                onClick={() => openComposer()}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <IconNavItem
              to="/app/settings"
              label="Settings"
              icon={Settings}
              forceActive={isSettingsActive}
            />
            <ThemeToggle variant="label" />
          </div>
        </div>
      </TooltipProvider>
    </nav>
  );
}

function IconNavItem({
  to,
  label,
  icon: Icon,
  forceActive,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  forceActive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          className="rounded-full lg:rounded-md border border-transparent w-full"
        >
          <NavLink
            to={to}
            className={({ isActive }: NavLinkRenderProps) =>
              cn(
                "flex size-11 lg:h-10 items-center lg:justify-start gap-3 rounded-full lg:rounded-lg border transition-colors lg:px-4",
                isActive || forceActive
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground",
              )
            }
            aria-label={label}
          >
            <Icon className="size-5 shrink-0" />
            <span className="hidden lg:block text-sm font-medium">{label}</span>
          </NavLink>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="lg:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function ActionNavItem({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          type="button"
          variant="ghost"
          onClick={onClick}
          className="rounded-full lg:rounded-md border border-transparent w-full"
        >
          <div
            className={cn(
              "flex size-11 h-10 justify-start gap-3 rounded-lg border transition-colors",
              "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="hidden lg:block text-sm font-medium">{label}</span>
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="lg:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
