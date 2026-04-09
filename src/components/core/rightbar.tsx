"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppViewer } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

type IntegrationsState = {
  githubConnected: boolean;
  wakatimeConnected: boolean;
  wakatimeProjects: Array<{
    id: string;
    name: string;
    timeLoggedSeconds: number;
    timeWorkedSeconds: number;
    humanReadableTotal: string | null;
  }>;
};

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0h 0m";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function RightBar() {
  const viewer = useAppViewer();
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState<"github" | "wakatime" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsState>({
    githubConnected: false,
    wakatimeConnected: false,
    wakatimeProjects: [],
  });

  const sessionUser = viewer.session?.user;
  const avatar = viewer.profile?.avatar ?? sessionUser?.image ?? undefined;
  const initials = (sessionUser?.name ?? "U").slice(0, 2).toUpperCase();

  async function refreshIntegrations() {
    if (!sessionUser) {
      return;
    }
    try {
      const data = await apiFetch<IntegrationsState>("/api/settings/integrations");
      setIntegrations(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load integrations.",
      );
    }
  }

  useEffect(() => {
    void refreshIntegrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id]);

  if (!sessionUser) {
    return null;
  }

  return (
    <div className="sticky top-3 flex h-max w-80 flex-col gap-3 pb-4">
      <Card size="sm" className="py-4">
        <CardContent className="px-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatar} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{sessionUser?.name ?? "Guest"}</p>
              <p className="text-xs text-muted-foreground">
                @{viewer.profile?.username ?? "builder"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-sm font-medium">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          <Item variant="outline" size="sm" className="rounded-xs">
            <ItemContent>
              <ItemTitle>GitHub</ItemTitle>
              <ItemDescription>
                {integrations.githubConnected
                  ? "Connected"
                  : "Connect to sync profile and repos."}
              </ItemDescription>
            </ItemContent>
            <Button
              size="sm"
              variant={integrations.githubConnected ? "outline" : "default"}
              disabled={busy !== null}
              onClick={async () => {
                setBusy("github");
                setMessage(null);
                if (!integrations.githubConnected) {
                  await authClient.signIn.social({
                    provider: "github",
                    callbackURL: "/feed",
                  });
                  return;
                }
                try {
                  await apiFetch<{ synced: boolean }>("/api/settings/integrations", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "sync-github" }),
                  });
                  setMessage("GitHub synced.");
                  await refreshIntegrations();
                } catch (error) {
                  setMessage(
                    error instanceof Error ? error.message : "Unable to sync GitHub.",
                  );
                } finally {
                  setBusy(null);
                }
              }}
            >
              {integrations.githubConnected ? "Sync" : "Connect"}
            </Button>
          </Item>

          <Item variant="outline" size="sm" className="rounded-xs">
            <ItemContent>
              <ItemTitle>WakaTime</ItemTitle>
              <ItemDescription>
                {integrations.wakatimeConnected
                  ? "Connected"
                  : "Connect to link coding-time projects."}
              </ItemDescription>
            </ItemContent>
          </Item>

          <div className="space-y-2">
            <Input
              placeholder="WakaTime API key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy !== null || !apiKey.trim()}
                onClick={async () => {
                  setBusy("wakatime");
                  setMessage(null);
                  try {
                    await apiFetch<{ connected: boolean }>(
                      "/api/settings/integrations",
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "connect-wakatime",
                          apiKey,
                        }),
                      },
                    );
                    setApiKey("");
                    setMessage("WakaTime connected.");
                    await refreshIntegrations();
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "Unable to connect WakaTime.",
                    );
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Connect
              </Button>
              {integrations.wakatimeConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy("wakatime");
                    setMessage(null);
                    try {
                      await apiFetch<{ connected: boolean }>(
                        "/api/settings/integrations",
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "disconnect-wakatime" }),
                        },
                      );
                      setMessage("WakaTime disconnected.");
                      await refreshIntegrations();
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to disconnect WakaTime.",
                      );
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  Disconnect
                </Button>
              ) : null}
            </div>
          </div>

          {integrations.wakatimeProjects.length ? (
            <div className="space-y-1">
              {integrations.wakatimeProjects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  className="rounded-xs border border-border bg-muted px-2 py-1.5 text-xs"
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="text-muted-foreground">
                    Logged {formatDuration(project.timeLoggedSeconds)} · Worked{" "}
                    {formatDuration(project.timeWorkedSeconds)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          <Button
            size="sm"
            variant="ghost"
            className="px-0"
            onClick={() => router.push("/settings")}
          >
            Open full settings
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
        <Link href="/">Terms</Link>
        <Link href="/">Privacy</Link>
        <Link href="/">Cookies</Link>
        <span>© 2026 Openflag</span>
      </div>
    </div>
  );
}
