"use client";

import { useState } from "react";

import { UiButton } from "@/components/ui/button";
import { UiCard } from "@/components/ui/card";
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
      <UiCard className="w-full p-4 sm:p-6">
        <UiCard.Header className="space-y-2">
          <UiPill>Authentication</UiPill>
          <UiCard.Title className="text-2xl font-medium tracking-tight sm:text-3xl">
            Sign in with proof-first identity
          </UiCard.Title>
          <UiCard.Description className="max-w-md text-sm text-muted">
            Use GitHub or Google only. We pull your avatar automatically, then
            take you into onboarding.
          </UiCard.Description>
          {claimedUsername ? (
            <p className="text-sm text-foreground/70">
              Username claimed: @{claimedUsername}
            </p>
          ) : null}
        </UiCard.Header>
        <UiCard.Content className="grid gap-3 pt-2">
          <UiButton
            className="rounded-xs"
            isDisabled={pendingProvider !== null}
            variant="outline"
            size="lg"
            onPress={async () => {
              await signIn("github");
            }}
          >
            {pendingProvider === "github"
              ? "Redirecting..."
              : "Continue with GitHub"}
          </UiButton>
          <UiButton
            className="rounded-xs"
            isDisabled={pendingProvider !== null}
            size="lg"
            onPress={async () => {
              await signIn("google");
            }}
          >
            {pendingProvider === "google"
              ? "Redirecting..."
              : "Continue with Google"}
          </UiButton>
        </UiCard.Content>
      </UiCard>
    </div>
  );
}
