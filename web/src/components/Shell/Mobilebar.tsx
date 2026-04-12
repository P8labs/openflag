import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import {
  Bell,
  Compass,
  Home,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";

const baseNavItems = [
  { label: "Home", to: "/app", icon: Home },
  { label: "Explore", to: "/app/explore", icon: Compass },
  { label: "Galaxy", to: "/app/galaxy", icon: Sparkles },
  { label: "Notifications", to: "/app/notifications", icon: Bell },
] as const;

export default function MobileBar() {
  const { user } = useAuth();
  const unreadQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () =>
      apiFetch<{ unreadCount: number }>(
        "/api/v1/me/notifications/unread-count",
      ),
    staleTime: 20_000,
  });
  const unread = unreadQuery.data?.unreadCount ?? 0;

  const navItems = [
    ...baseNavItems,
    { label: "Profile", to: `/${user?.username ?? "user"}`, icon: User },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-secondary bg-secondary/20 flex justify-around items-center h-16 z-40">
      <TooltipProvider>
        <div className="flex justify-around items-center w-full">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              badge={item.label === "Notifications" ? unread : 0}
            />
          ))}
        </div>
      </TooltipProvider>
    </nav>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          size="icon-lg"
          className="rounded-full border border-transparent"
        >
          <NavLink
            to={to}
            className={({ isActive }: NavLinkRenderProps) =>
              `inline-flex size-10 items-center justify-center rounded-full border transition-colors ${
                isActive
                  ? "bg-primary border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
              }`
            }
            aria-label={label}
          >
            <span className="relative inline-flex">
              <Icon className="size-4" />
              {badge && badge > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </span>
          </NavLink>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
