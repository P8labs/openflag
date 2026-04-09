"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UiPill } from "@/components/ui/pill";
import { slugifyUsername } from "@/lib/username";
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
    <main className="mx-auto w-full max-w-2xl px-4 py-12 space-y-6 flex items-center justify-center flex-col">
      <section className="flex flex-col gap-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            A calmer place for builders to meet and ship.
          </h1>

          <p className="text-sm text-muted-foreground max-w-lg">
            Claim a username, sign in once, and build a profile around real work
            instead of noise.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4 w-full">
        <div className="space-y-2">
          <h2 className="text-lg font-medium tracking-tight">
            Claim your username
          </h2>
          <p className="text-sm text-muted-foreground">
            Reserve your handle before entering auth.
          </p>
        </div>

        <div className="flex items-center gap-2 border-b border-border pb-2">
          <span className="text-muted-foreground">@</span>
          <input
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            placeholder="your-handle"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            size="lg"
            onClick={() =>
              router.push(
                `/auth?username=${encodeURIComponent(claimedUsername)}`,
              )
            }
          >
            Continue
          </Button>
        </div>
      </section>
    </main>
  );
}
