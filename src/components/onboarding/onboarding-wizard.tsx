"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { UiButton } from "@/components/ui/button";
import { UiCard } from "@/components/ui/card";
import { UiInput, UiSelect, UiTextArea } from "@/components/ui/field";
import { UiPill } from "@/components/ui/pill";
import { apiFetch } from "@/lib/api";
import { slugifyUsername } from "@/lib/username";

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
            <UiPill>Onboarding</UiPill>
            <UiPill>Step {step + 1} of 3</UiPill>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Build trust before the feed starts ranking you.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">
            Step 1 is required. The rest can be skipped for now, but the banner
            will stay until every step is done.
          </p>

          <div className="ui-panel-muted mt-6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Profile picture
            </p>
            <div className="mt-3 flex items-center gap-3">
              <img
                alt={user.name}
                className="size-14 rounded-xs object-cover ring-1 ring-black/10 dark:ring-white/10"
                src={profile?.avatar ?? user.image ?? ""}
              />
              <div>
                <p className="text-sm font-medium">Imported from auth</p>
                <p className="text-sm text-muted">Not editable at this step.</p>
              </div>
            </div>
          </div>
        </aside>

        <UiCard className="p-4 sm:p-5">
          <UiCard.Header className="space-y-2">
            <UiCard.Title className="text-2xl font-medium tracking-tight sm:text-3xl">
              {isIdentityStep
                ? "Identity"
                : isDetailsStep
                  ? "Profile signals"
                  : "Project starter"}
            </UiCard.Title>
            <UiCard.Description className="max-w-2xl text-sm text-muted">
              {isIdentityStep
                ? "Claim your handle and tell people who you are."
                : isDetailsStep
                  ? "Tell the app what you can do, what you want, and how you like to work."
                  : "Create a first project post or skip for now and return later."}
            </UiCard.Description>
          </UiCard.Header>

          <UiCard.Content className="grid gap-4 pt-2">
            {isIdentityStep ? (
              <>
                <label className="grid gap-2 text-sm text-muted">
                  Username
                  <UiInput
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Name
                  <UiInput
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Gender
                  <UiSelect
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </UiSelect>
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Bio
                  <UiTextArea
                    placeholder="What kind of builder are you?"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted">
                    Username, name, gender, and bio are required.
                  </p>
                  <UiButton
                    className="rounded-xs"
                    isDisabled={isSaving}
                    size="lg"
                    onPress={saveIdentity}
                  >
                    {isSaving ? "Saving..." : "Continue"}
                  </UiButton>
                </div>
              </>
            ) : null}

            {isDetailsStep ? (
              <>
                <label className="grid gap-2 text-sm text-muted">
                  Interests
                  <UiInput
                    placeholder="AI tools, open source, infra"
                    value={interests}
                    onChange={(event) => setInterests(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Skills
                  <UiInput
                    placeholder="TypeScript, design systems, backend"
                    value={skills}
                    onChange={(event) => setSkills(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Availability
                  <UiInput
                    placeholder="8 hrs/week, evenings"
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Personality
                  <UiSelect
                    value={personality}
                    onChange={(event) => setPersonality(event.target.value)}
                  >
                    <option value="">Select personality</option>
                    <option value="introvert">Introvert</option>
                    <option value="extrovert">Extrovert</option>
                    <option value="it-depends">It depends</option>
                  </UiSelect>
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  What are you looking for?
                  <UiTextArea
                    placeholder="What makes someone worth building with?"
                    value={lookingFor}
                    onChange={(event) => setLookingFor(event.target.value)}
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    className="text-sm text-muted underline decoration-black/20 underline-offset-4 dark:decoration-white/20"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    Skip for now
                  </button>
                  <UiButton
                    className="rounded-xs"
                    isDisabled={isSaving}
                    size="lg"
                    onPress={saveDetails}
                  >
                    {isSaving ? "Saving..." : "Save profile signals"}
                  </UiButton>
                </div>
              </>
            ) : null}

            {isProjectStep ? (
              <>
                <div className="ui-panel-muted p-5">
                  <p className="text-sm font-medium">
                    Create one proof-of-work post.
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Share a project, attach a GitHub URL, or come back later.
                    The banner stays until you finish this step.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    className="text-sm text-muted underline decoration-black/20 underline-offset-4 dark:decoration-white/20"
                    type="button"
                    onClick={() => router.push("/feed")}
                  >
                    Skip for now
                  </button>
                  <UiButton
                    className="rounded-xs"
                    size="lg"
                    onPress={async () => {
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
                  </UiButton>
                </div>
              </>
            ) : null}

            {message ? <p className="text-sm text-danger">{message}</p> : null}
          </UiCard.Content>
        </UiCard>
      </div>
    </div>
  );
}
