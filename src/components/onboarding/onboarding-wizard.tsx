"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { slugifyUsername } from "@/lib/username";
import { Badge } from "../ui/badge";

type Profile = {
  username: string;
  avatar: string | null;
  bio: string | null;
  gender: string | null;
  personality: string | null;
  lookingFor: string | null;
  skills: string[];
  interests: string[];
  availability: string | null;
  onboardingComplete: boolean;
  onboardingDetailsComplete: boolean;
  onboardingProjectComplete: boolean;
};

type Props = {
  claimedUsername?: string;
  profile: Profile | null;
  user: {
    name: string;
    image: string | null;
  };
};

function splitItems(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
}

export function OnboardingWizard({ claimedUsername, profile, user }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(() => {
    if (!profile?.onboardingComplete) {
      return 0;
    }

    if (!profile.onboardingDetailsComplete) {
      return 1;
    }

    if (!profile.onboardingProjectComplete) {
      return 2;
    }

    return 3;
  });

  const [username, setUsername] = useState(
    claimedUsername ??
      profile?.username ??
      slugifyUsername(user.name, "builder"),
  );
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [skills, setSkills] = useState(profile?.skills.join(", ") ?? "");
  const [interests, setInterests] = useState(
    profile?.interests.join(", ") ?? "",
  );
  const [availability, setAvailability] = useState(profile?.availability ?? "");
  const [personality, setPersonality] = useState(profile?.personality ?? "");
  const [lookingFor, setLookingFor] = useState(profile?.lookingFor ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const bannerMessage = useMemo(() => {
    if (step <= 0) {
      return "Complete your identity step to unlock the app.";
    }

    if (step === 1) {
      return "Add skills, interests, availability, and collaboration signals.";
    }

    return "Create your first project to complete onboarding.";
  }, [step]);

  async function saveIdentity() {
    setIsSaving(true);
    setMessage(null);

    try {
      await apiFetch<{ profile: Profile }>("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: "identity",
          username,
          name,
          gender,
          bio,
        }),
      });
      setStep(1);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDetails() {
    setIsSaving(true);
    setMessage(null);

    try {
      await apiFetch<{ profile: Profile }>("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: "details",
          skills: splitItems(skills),
          interests: splitItems(interests),
          availability,
          personality,
          lookingFor,
        }),
      });
      setStep(2);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  const isIdentityStep = step === 0;
  const isDetailsStep = step === 1;
  const isProjectStep = step === 2;
  const isComplete = step >= 3;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="sticky top-4 z-20">
        <div className="ui-panel-muted px-4 py-3 text-sm text-foreground/75">
          {bannerMessage}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="ui-panel p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <Badge>Onboarding</Badge>
            <Badge>Step {step + 1} of 3</Badge>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Build trust before the feed starts ranking you.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Step 1 is required. The rest can be skipped for now, but the banner
            will stay until every step is done.
          </p>

          <div className="bg-muted p-4 mt-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Profile picture
            </p>
            <div className="mt-3 flex items-center gap-3">
              <img
                alt={user.name}
                className="size-14 rounded-full object-cover"
                src={profile?.avatar ?? user.image ?? ""}
              />
              <div>
                <p className="text-sm font-medium">Imported from auth</p>
                <p className="text-sm text-muted-foreground">
                  Not editable at this step.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <Card className="p-4 sm:p-5">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-medium tracking-tight sm:text-3xl">
              {isIdentityStep
                ? "Identity"
                : isDetailsStep
                  ? "Profile signals"
                  : "Project starter"}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-muted-foreground">
              {isIdentityStep
                ? "Claim your handle and tell people who you are."
                : isDetailsStep
                  ? "Tell the app what you can do, what you want, and how you like to work."
                  : isProjectStep
                    ? "Create a first project post or skip for now and return later."
                    : "You're all set. Head to feed and start posting."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {isIdentityStep ? (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="onboarding-username">
                    Username
                  </FieldLabel>
                  <Input
                    id="onboarding-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-name">Name</FieldLabel>
                  <Input
                    id="onboarding-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-gender">Gender</FieldLabel>
                  <select
                    id="onboarding-gender"
                    className="h-9 w-full rounded-xs border border-border bg-input px-3 text-sm outline-none"
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-bio">Bio</FieldLabel>
                  <Textarea
                    id="onboarding-bio"
                    placeholder="What kind of builder are you?"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                  <FieldDescription>
                    Keep it concise and focused on what you build.
                  </FieldDescription>
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Username, name, gender, and bio are required.
                  </p>
                  <Button disabled={isSaving} size="lg" onClick={saveIdentity}>
                    {isSaving ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </FieldGroup>
            ) : null}

            {isDetailsStep ? (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="onboarding-interests">
                    Interests
                  </FieldLabel>
                  <Input
                    id="onboarding-interests"
                    placeholder="AI tools, open source, infra"
                    value={interests}
                    onChange={(event) => setInterests(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-skills">Skills</FieldLabel>
                  <Input
                    id="onboarding-skills"
                    placeholder="TypeScript, design systems, backend"
                    value={skills}
                    onChange={(event) => setSkills(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-availability">
                    Availability
                  </FieldLabel>
                  <Input
                    id="onboarding-availability"
                    placeholder="8 hrs/week, evenings"
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-personality">
                    Personality
                  </FieldLabel>
                  <select
                    id="onboarding-personality"
                    className="h-9 w-full rounded-xs border border-border bg-input px-3 text-sm outline-none"
                    value={personality}
                    onChange={(event) => setPersonality(event.target.value)}
                  >
                    <option value="">Select personality</option>
                    <option value="introvert">Introvert</option>
                    <option value="extrovert">Extrovert</option>
                    <option value="it-depends">It depends</option>
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="onboarding-looking-for">
                    What are you looking for?
                  </FieldLabel>
                  <Textarea
                    id="onboarding-looking-for"
                    placeholder="What makes someone worth building with?"
                    value={lookingFor}
                    onChange={(event) => setLookingFor(event.target.value)}
                  />
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    className="text-sm text-muted-foreground underline underline-offset-4"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    Skip for now
                  </button>
                  <Button disabled={isSaving} size="lg" onClick={saveDetails}>
                    {isSaving ? "Saving..." : "Save profile signals"}
                  </Button>
                </div>
              </FieldGroup>
            ) : null}

            {isProjectStep ? (
              <>
                <div className="rounded-xs border border-border bg-muted p-5">
                  <p className="text-sm font-medium">
                    Create one proof-of-work post.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Share a project, attach a GitHub URL, or come back later.
                    The banner stays until you finish this step.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    className="text-sm text-muted-foreground underline underline-offset-4"
                    type="button"
                    onClick={() => router.push("/feed")}
                  >
                    Skip for now
                  </button>
                  <Button
                    size="lg"
                    onClick={async () => {
                      await apiFetch<{ profile: Profile }>("/api/profile", {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ step: "project" }),
                      });
                      router.push("/post-project?onboarding=1");
                    }}
                  >
                    Create project post
                  </Button>
                </div>
              </>
            ) : null}

            {isComplete ? (
              <div className="rounded-xs border border-border bg-muted p-5">
                <p className="text-sm font-medium">Onboarding complete.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your profile is ready. Continue to feed.
                </p>
                <div className="mt-3">
                  <Button size="sm" onClick={() => router.push("/feed")}>
                    Go to feed
                  </Button>
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="text-sm text-destructive">{message}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
