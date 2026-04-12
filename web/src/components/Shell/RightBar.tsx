import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { loginWithProvider } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";
import { StreakHeatmap } from "./StreakHeatmap";

type ActivityResponse = {
  currentStreak: number;
  longestStreak: number;
  days: Array<{ date: string; count: number }>;
};

export default function RightBar() {
  return (
    <div className="flex flex-col w-full max-w-sm rounded-r-md border border-secondary bg-secondary/20 p-5 h-[calc(100vh-1rem)]">
      <ProfileCard />
    </div>
  );
}

function ProfileCard() {
  const { user, connections } = useAuth();
  const activityQuery = useQuery({
    queryKey: ["me-activity"],
    queryFn: () => apiFetch<ActivityResponse>("/api/v1/me/activity"),
    staleTime: 60_000,
  });

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="w-full space-y-3">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Profile
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border border-border">
              {user.image ? (
                <AvatarImage src={user.image} alt={`@${user.username}`} />
              ) : (
                <AvatarFallback className="font-mono">
                  {initials || "?"}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex flex-col leading-tight">
              <span className="font-medium">{user.name}</span>
              <Link
                to={`/${user.username}`}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                @{user.username}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <StreakHeatmap
        title="Streak"
        currentStreak={activityQuery.data?.currentStreak ?? 0}
        longestStreak={activityQuery.data?.longestStreak ?? 0}
        days={activityQuery.data?.days ?? []}
        className="border-t border-border pt-4"
      />

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Bio
        </p>
        <p className="text-sm leading-relaxed">
          {user.bio ||
            "Add a short bio in onboarding to help collaborators understand your focus."}
        </p>
      </div>

      <TagSection
        title="Skills"
        emptyText="No skills selected yet."
        items={user.skills}
      />

      <TagSection
        title="Interests"
        emptyText="No interests selected yet."
        items={user.interests}
      />

      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Integrations
        </p>

        <div className="flex flex-wrap gap-2">
          <StatusPill
            label="GitHub"
            active={connections.githubConnected}
            onConnect={() => loginWithProvider("github")}
          />
          <StatusPill
            label="WakaTime"
            active={connections.wakatimeConnected}
            onConnect={() => window.location.assign("/onboard")}
          />
        </div>
      </div>
    </section>
  );
}

function TagSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>

      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="font-mono text-[11px]"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function StatusPill({
  label,
  active,
  onConnect,
}: {
  label: string;
  active: boolean;
  onConnect: () => void;
}) {
  return active ? (
    <Badge variant="soft" className="font-mono text-[11px]">
      {label} connected
    </Badge>
  ) : (
    <Button
      type="button"
      size="sm"
      className="font-mono text-[11px]"
      onClick={onConnect}
    >
      Connect {label}
    </Button>
  );
}
