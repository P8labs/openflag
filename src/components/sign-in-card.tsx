"use client";

import { Button, Card } from "@heroui/react";

import { authClient } from "@/lib/auth-client";

export function SignInCard() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center p-6">
      <Card className="w-full gap-6 p-8" variant="secondary">
        <Card.Header className="space-y-1">
          <Card.Title className="text-3xl font-semibold">Openflag</Card.Title>
          <Card.Description>
            Discover collaborators in seconds. Swipe creators and projects until
            you find a fit.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Button
            className="w-full"
            variant="primary"
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
