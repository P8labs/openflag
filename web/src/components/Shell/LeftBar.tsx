import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import {
  Bell,
  Compass,
  FolderKanban,
  Home,
  LogOutIcon,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";

const navItems = [
  { label: "Home", to: "/app", icon: Home },
  { label: "Explore", to: "/app/explore", icon: Compass },
  // { label: "Galaxy", to: "/app/galaxy", icon: Sparkles }, // NEEDED MORE WORK
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
] as const;

export default function LeftBar() {
  const { signOut } = useAuth();
  const { openComposer } = usePostComposer();
  const unreadQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () =>
      apiFetch<{ unreadCount: number }>(
        "/api/v1/me/notifications/unread-count",
      ),
    staleTime: 20_000,
  });
  const unread = unreadQuery.data?.unreadCount ?? 0;

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

              <IconNavItem
                to="/app/notifications"
                label="Notifications"
                icon={Bell}
                badge={unread}
              />

              <ActionNavItem
                label="Create Post"
                icon={SquarePen}
                onClick={() => openComposer()}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <ActionNavItem
              label="Sign Out"
              danger
              icon={LogOutIcon}
              onClick={() => signOut()}
            />
            {/* <IconNavItem
              to="/app/settings"
              label="Settings"
              icon={Settings}
              forceActive={isSettingsActive}
            /> */}
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
  badge,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  forceActive?: boolean;
  badge?: number;
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
            <span className="relative inline-flex">
              <Icon className="size-5 shrink-0" />
              {badge && badge > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </span>
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
  danger = false,
}: {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          type="button"
          variant={danger ? "destructive" : "ghost"}
          onClick={onClick}
          className="rounded-full lg:rounded-md border border-transparent w-full"
        >
          <div
            className={cn(
              "flex size-11 h-10 justify-start gap-3 rounded-lg border",
              !danger &&
                "text-foreground border-border hover:bg-accent hover:text-accent-foreground transition-colors",
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
