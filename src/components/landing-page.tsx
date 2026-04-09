"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UiPill } from "@/components/ui/pill";
import { slugifyUsername } from "@/lib/username";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

export function LandingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const claimedUsername = slugifyUsername(username, "builder");

  const steps = [
    {
      title: "Claim",
      body: "Reserve a handle before you sign in so the identity is yours from the start.",
    },
    {
      title: "Verify",
      body: "Use GitHub or Google. We import the basics and shape the profile around real work.",
    },
    {
      title: "Ship",
      body: "Enter onboarding, post proof of work, and start surfacing to the right builders.",
    },
  ];

  const highlights = [
    {
      title: "Proof-first profiles",
      body: "Profiles are built from work signals, not follower counts or empty bios.",
    },
    {
      title: "Project-centered discovery",
      body: "The feed and public profile are organized around what people are shipping.",
    },
    {
      title: "Quiet trust mechanics",
      body: "Circles, verification, and streaks exist to reduce noise and reward consistency.",
    },
  ];

  return (
    <main className="ui-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="ui-panel overflow-hidden">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <UiPill>Manifesto</UiPill>
                <UiPill>Proof of work</UiPill>
                <UiPill>Quiet by design</UiPill>
              </div>

              <div className="max-w-2xl space-y-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  Openflag
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  A calmer place for builders to meet, claim, and ship.
                </h1>
                <p className="max-w-xl text-sm text-muted sm:text-base">
                  Openflag turns identity into a useful signal. You claim a
                  username, sign in once, and move into a profile and feed that
                  are organized around proof instead of noise.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "1", label: "username to claim" },
                  { value: "2", label: "login providers" },
                  { value: "3", label: "steps to start" },
                ].map((item) => (
                  <div key={item.label} className="ui-panel-soft p-4">
                    <p className="text-2xl font-semibold tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-muted">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="ui-button-ghost px-4 py-3 text-sm font-medium"
                  href="/roadmap"
                >
                  Read roadmap
                </Link>
                <Link
                  className="ui-button-ghost px-4 py-3 text-sm font-medium"
                  href="/auth"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-medium tracking-tight">
                  Claim your username
                </CardTitle>
                <CardDescription className="text-sm text-muted">
                  Reserve your handle before entering auth.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2">
                <label className="grid gap-2 text-sm text-muted">
                  Username
                  <div className="flex items-center gap-1 ui-input px-4 py-3">
                    <span className="text-foreground/45">@</span>
                    <input
                      className="w-full border-0 bg-transparent pl-1 outline-none placeholder:text-muted"
                      placeholder="your-handle"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </div>
                </label>

                <div className="ui-panel-muted border-dashed p-4 text-sm text-foreground/70">
                  Preview: @{claimedUsername}
                </div>

                <Button
                  className="rounded-xs"
                  size="lg"
                  onClick={() =>
                    router.push(
                      `/auth?username=${encodeURIComponent(claimedUsername)}`,
                    )
                  }
                >
                  Continue to auth
                </Button>

                <p className="text-xs leading-5 text-muted">
                  GitHub and Google are the only login options. Identity is
                  imported, then refined in onboarding.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="ui-panel p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Step {index + 1}
              </p>
              <h2 className="mt-3 text-lg font-medium tracking-tight">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="ui-panel grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              What you get
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for signal, not spectacle.
            </h2>
            <p className="max-w-xl text-sm text-muted sm:text-base">
              The interface stays quiet so the important parts stand out: names,
              work, roles, and whether someone is worth meeting.
            </p>
          </div>

          <div className="grid gap-3">
            {highlights.map((item) => (
              <div key={item.title} className="ui-panel-soft p-4">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-panel grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Ready to start
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pick a handle and continue.
            </h2>
          </div>
          <Button
            className="rounded-xs"
            size="lg"
            onClick={() =>
              router.push(
                `/auth?username=${encodeURIComponent(claimedUsername)}`,
              )
            }
          >
            Continue to auth
          </Button>
        </section>
      </div>
    </main>
  );
}
