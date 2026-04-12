import { Bell, Flame } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiFetch } from "@/lib/api";
import { StreakHeatmap } from "./StreakHeatmap";

type ActivityResponse = {
  currentStreak: number;
  longestStreak: number;
  days: Array<{ date: string; count: number }>;
};

type UnreadResponse = {
  unreadCount: number;
};

export default function MobileTopBar() {
  const queryClient = useQueryClient();

  const activityQuery = useQuery({
    queryKey: ["me-activity"],
    queryFn: () => apiFetch<ActivityResponse>("/api/v1/me/activity"),
    staleTime: 60_000,
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () =>
      apiFetch<UnreadResponse>("/api/v1/me/notifications/unread-count"),
    staleTime: 20_000,
  });

  const readAllMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>("/api/v1/me/notifications/read-all", {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const currentStreak = activityQuery.data?.currentStreak ?? 0;
  const unread = unreadQuery.data?.unreadCount ?? 0;

  return (
    <header className="md:hidden sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <Link to="/app" className="inline-flex items-center">
          <BrandLogo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Flame className="size-4 text-orange-500" />
                <span>{currentStreak}d</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(28rem,calc(100vw-1.5rem))]"
            >
              <StreakHeatmap
                title="Streak heatmap"
                currentStreak={currentStreak}
                longestStreak={activityQuery.data?.longestStreak ?? 0}
                days={activityQuery.data?.days ?? []}
                className="space-y-2"
              />
            </PopoverContent>
          </Popover>

          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              if (unread > 0) {
                readAllMutation.mutate();
              }
            }}
          >
            <Link to="/app/notifications" aria-label="Notifications">
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
