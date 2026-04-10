import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import { Compass, Home, Sparkles, User, type LucideIcon } from "lucide-react";

import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const navItems = [
  { label: "Home", to: "/app", icon: Home },
  { label: "Explore", to: "/app/explore", icon: Compass },
  { label: "Galaxy", to: "/app/galaxy", icon: Sparkles },
  { label: "Profile", to: "/app/profile", icon: User },
] as const;

export default function MobileBar() {
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
}: {
  to: string;
  label: string;
  icon: LucideIcon;
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
            <Icon className="size-4" />
          </NavLink>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
