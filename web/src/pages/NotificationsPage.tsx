import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  readAt?: string | null;
  actor: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

function targetHref(item: NotificationItem) {
  if (item.entityType === "post") {
    return `/app?postId=${item.entityId}`;
  }
  if (item.entityType === "project") {
    return `/app/projects/${item.entityId}`;
  }
  return "/app";
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiFetch<NotificationsResponse>("/api/v1/me/notifications?limit=50"),
  });

  const readAllMutation = useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationsResponse>([
        "notifications",
      ]);

      queryClient.setQueryData<NotificationsResponse>(
        ["notifications"],
        (current) => {
          if (!current) {
            return current;
          }

          const now = new Date().toISOString();
          return {
            ...current,
            unreadCount: 0,
            notifications: current.notifications.map((item) => ({
              ...item,
              readAt: item.readAt ?? now,
            })),
          };
        },
      );

      return { previous };
    },
    mutationFn: () =>
      apiFetch<{ success: boolean }>("/api/v1/me/notifications/read-all", {
        method: "POST",
      }),
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  if (notificationsQuery.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-3 py-5 lg:px-6 lg:py-6">
        <p className="text-sm text-muted-foreground">
          Loading notifications...
        </p>
      </section>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-3 py-5 lg:px-6 lg:py-6">
        <p className="text-sm text-destructive">
          {notificationsQuery.error instanceof Error
            ? notificationsQuery.error.message
            : "Unable to load notifications."}
        </p>
      </section>
    );
  }

  const payload = notificationsQuery.data;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-3 py-5 lg:px-6 lg:py-6">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {payload?.unreadCount ?? 0} unread
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => readAllMutation.mutate()}
          disabled={
            readAllMutation.isPending || (payload?.unreadCount ?? 0) === 0
          }
        >
          Mark all read
        </Button>
      </header>

      {(payload?.notifications ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {(payload?.notifications ?? []).map((item) => (
            <li key={item.id} className="py-3">
              <Link
                to={targetHref(item)}
                className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/40"
              >
                <Avatar className="size-9 border border-border">
                  {item.actor.image ? (
                    <AvatarImage
                      src={item.actor.image}
                      alt={item.actor.username}
                    />
                  ) : (
                    <AvatarFallback>
                      {(item.actor.name || "U").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{item.actor.name}</span>{" "}
                    {item.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@{item.actor.username}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {!item.readAt ? <Badge variant="soft">New</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
