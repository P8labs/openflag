"use client";

import { useState } from "react";

import { UiPill } from "@/components/ui/pill";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Props = {
  githubConnected: boolean;
  wakatimeConnected: boolean;
};

export function IntegrationsSettings({
  githubConnected,
  wakatimeConnected,
}: Props) {
  const [githubOn, setGithubOn] = useState(githubConnected);
  const [wakatimeOn, setWakatimeOn] = useState(wakatimeConnected);
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"github" | "wakatime" | null>(null);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <header className="ui-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Settings
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Integrations
        </h1>
      </header>

      <section className="ui-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">GitHub</p>
            <p className="text-sm text-muted">
              Connect GitHub to sync profile identity and repositories.
            </p>
          </div>
          <UiPill>{githubOn ? "Connected" : "Not connected"}</UiPill>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!githubOn ? (
            <Button
              disabled={busy !== null}
              onClick={async () => {
                setBusy("github");
                await authClient.signIn.social({
                  provider: "github",
                  callbackURL: "/settings",
                });
              }}
            >
              Connect GitHub
            </Button>
          ) : (
            <Button
              disabled={busy !== null}
              onClick={async () => {
                setBusy("github");
                setMessage(null);

                try {
                  await apiFetch<{ synced: boolean }>(
                    "/api/settings/integrations",
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "sync-github" }),
                    },
                  );
                  setGithubOn(true);
                  setMessage("GitHub synced.");
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Unable to sync GitHub.",
                  );
                } finally {
                  setBusy(null);
                }
              }}
            >
              Sync GitHub
            </Button>
          )}
        </div>
      </section>

      <section className="ui-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">WakaTime</p>
            <p className="text-sm text-muted">
              Save your WakaTime API key to power future coding-time signals.
            </p>
          </div>
          <UiPill>{wakatimeOn ? "Connected" : "Not connected"}</UiPill>
        </div>

        <div className="mt-4 space-y-3">
          <Input
            placeholder="WakaTime API key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
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
                  setWakatimeOn(true);
                  setApiKey("");
                  setMessage("WakaTime connected.");
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
              Connect WakaTime
            </Button>
            {wakatimeOn ? (
              <Button
                disabled={busy !== null}
                variant="outline"
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
                    setWakatimeOn(false);
                    setMessage("WakaTime disconnected.");
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
      </section>

      {message ? <p className="px-1 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
