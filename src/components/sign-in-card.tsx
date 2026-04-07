"use client";

import { Button, Card } from "@heroui/react";

import { authClient } from "@/lib/auth-client";

export function SignInCard() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-4 py-8">
      <Card
        className="w-full rounded-xs border border-black/5 bg-white/80 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-white/5 sm:p-8"
        variant="default"
      >
        <Card.Header className="space-y-2">
          <Card.Title className="text-2xl font-medium tracking-tight sm:text-3xl">
            Openflag
          </Card.Title>
          <Card.Description className="max-w-md text-sm text-muted">
            Discover collaborators in seconds. Swipe creators and projects until
            you find a fit.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Button
            className="rounded-xs"
            variant="outline"
            size="lg"
            onPress={async () => {
              await authClient.signIn.social({
                provider: "github",
                callbackURL: "/",
              });
            }}
          >
            Continue with GitHub
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
