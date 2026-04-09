"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UiPill } from "@/components/ui/pill";
import { authClient } from "@/lib/auth-client";

type Props = {
  claimedUsername?: string;
};

export function SignInCard({ claimedUsername }: Props) {
  const [pendingProvider, setPendingProvider] = useState<
    "github" | "google" | null
  >(null);

  async function signIn(provider: "github" | "google") {
    setPendingProvider(provider);

    await authClient.signIn.social({
      provider,
      callbackURL: claimedUsername
        ? `/onboarding?claimed=${encodeURIComponent(claimedUsername)}`
        : "/onboarding",
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg items-center justify-center px-4 py-8">
      <Card className="w-full p-4 sm:p-6">
        <CardHeader className="space-y-2">
          <UiPill>Authentication</UiPill>
          <CardTitle className="text-2xl font-medium tracking-tight sm:text-3xl">
            Sign in with proof-first identity
          </CardTitle>
          <CardDescription className="max-w-md text-sm text-muted">
            Use GitHub or Google only. We pull your avatar automatically, then
            take you into onboarding.
          </CardDescription>
          {claimedUsername ? (
            <p className="text-sm text-foreground/70">
              Username claimed: @{claimedUsername}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-3 pt-2">
          <Button
            className="rounded-xs"
            disabled={pendingProvider !== null}
            variant="outline"
            size="lg"
            onClick={async () => {
              await signIn("github");
            }}
          >
            {pendingProvider === "github"
              ? "Redirecting..."
              : "Continue with GitHub"}
          </Button>
          <Button
            className="rounded-xs"
            disabled={pendingProvider !== null}
            size="lg"
            onClick={async () => {
              await signIn("google");
            }}
          >
            {pendingProvider === "google"
              ? "Redirecting..."
              : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
