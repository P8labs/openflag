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
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight">
            Sign in with proof-first identity
          </h1>

          <p className="text-sm text-muted-foreground max-w-sm">
            Use GitHub or Google. Your profile is created automatically, then
            you continue to onboarding.
          </p>

          {claimedUsername && (
            <p className="text-sm text-foreground/60">@{claimedUsername}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="lg"
            className="justify-center"
            disabled={pendingProvider !== null}
            onClick={async () => {
              await signIn("github");
            }}
          >
            {pendingProvider === "github"
              ? "Redirecting..."
              : "Continue with GitHub"}
          </Button>

          <Button
            size="lg"
            className="justify-center"
            disabled={pendingProvider !== null}
            onClick={async () => {
              await signIn("google");
            }}
          >
            {pendingProvider === "google"
              ? "Redirecting..."
              : "Continue with Google"}
          </Button>
        </div>
      </div>
    </div>
  );
}
