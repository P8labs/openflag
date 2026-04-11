import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaGithub } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loginWithProvider, useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import {
  onboardingStepOneSchema,
  onboardingStepThreeSchema,
  onboardingStepTwoSchema,
  type OnboardingStepValues,
} from "@/lib/schemas";
import type { User } from "@/lib/auth";

const stepTitles = {
  1: "Build your profile",
  2: "Tell us your goals",
  3: "Connect your tools",
} as const;

const suggestedSkills = [
  "Go",
  "TypeScript",
  "React",
  "Node.js",
  "Product Design",
  "AI/ML",
  "DevOps",
  "Data Engineering",
];

const suggestedInterests = [
  "Open Source",
  "SaaS",
  "Developer Tools",
  "Fintech",
  "HealthTech",
  "EdTech",
  "Web3",
  "Mobile Apps",
];

const availabilityOptions = [
  "Weekdays",
  "Weekends",
  "Evenings",
  "Part-time",
  "Full-time",
];

const lookingForOptions = [
  "Co-founders",
  "Contributors",
  "Design partners",
  "Mentors",
  "Early users",
  "Freelance work",
];

function toggleItem(items: string[], value: string) {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }

  return [...items, value];
}

function normalize(value: string | null | undefined) {
  return value ?? "";
}

function defaultValues(user: User | null): OnboardingStepValues {
  return {
    username: normalize(user?.username),
    bio: normalize(user?.bio),
    skills: user?.skills ?? [],
    interests: user?.interests ?? [],
    availability: normalize(user?.availability),
    lookingFor: normalize(user?.lookingFor),
    wakatimeApiKey: "",
  };
}

type Payload = {
  step: 1 | 2 | 3;
  skip?: boolean;
  username?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  availability?: string;
  lookingFor?: string;
  wakatimeApiKey?: string;
};

export function OnboardStepForm() {
  const { user, connections } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState(() =>
    user?.onboardState ? Math.min(user.onboardState + 1, 3) : 1,
  );
  const [message, setMessage] = useState<string | null>(null);

  const schema = useMemo(() => {
    if (step === 1) {
      return onboardingStepOneSchema;
    }

    if (step === 2) {
      return onboardingStepTwoSchema;
    }

    return onboardingStepThreeSchema;
  }, [step]);

  const form = useForm<OnboardingStepValues>({
    resolver: zodResolver(schema) as Resolver<OnboardingStepValues>,
    defaultValues: defaultValues(user),
    mode: "onSubmit",
  });

  useEffect(() => {
    const nextStep = user?.onboardState
      ? Math.min(user.onboardState + 1, 3)
      : 1;
    setStep(nextStep);
    form.reset(defaultValues(user));
  }, [form, user]);

  const onboardingMutation = useMutation({
    mutationFn: (payload: Payload) =>
      apiFetch<{ user: { onboardState: number } }>(
        "/api/v1/me/onboarding/step",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: async () => {
      setMessage("Saved.");
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      if (step === 3) {
        navigate("/app", { replace: true });
        return;
      }

      setStep((current) => Math.min(current + 1, 3));
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Unable to save step.",
      );
    },
  });

  const submitLabel = useMemo(() => {
    if (onboardingMutation.isPending) {
      return "Saving...";
    }

    return step === 3 ? "Finish onboarding" : "Continue";
  }, [onboardingMutation.isPending, step]);

  const values = form.watch();
  const canSubmitStepOne =
    values.username.trim().length >= 3 && values.bio.trim().length > 0;

  const onSubmit = form.handleSubmit((formValues) => {
    setMessage(null);

    if (step === 1) {
      onboardingMutation.mutate({
        step: 1,
        username: formValues.username.trim(),
        bio: formValues.bio.trim(),
        skills: formValues.skills,
        interests: formValues.interests,
      });
      return;
    }

    if (step === 2) {
      onboardingMutation.mutate({
        step: 2,
        availability: formValues.availability?.trim() ?? "",
        lookingFor: formValues.lookingFor?.trim() ?? "",
      });
      return;
    }

    onboardingMutation.mutate({
      step: 3,
      wakatimeApiKey: formValues.wakatimeApiKey?.trim() ?? "",
    });
  });

  const skipStep = () => {
    setMessage(null);
    onboardingMutation.mutate({ step: step as 2 | 3, skip: true });
  };

  const currentStepTitle = stepTitles[step as 1 | 2 | 3];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Step {step} of 3
        </p>
        <p className="text-2xl font-semibold leading-tight">
          {currentStepTitle}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Step 1 is required. Steps 2 and 3 are optional and can be skipped.
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        {step === 1 ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...form.register("username")}
                placeholder="openflag-builder"
              />
              {form.formState.errors.username ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.username.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                rows={4}
                placeholder="I build tools for creators and care about fast feedback loops."
              />
              {form.formState.errors.bio ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.bio.message}
                </p>
              ) : null}
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium">Skills</p>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((item) => {
                  const selected = values.skills.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                      onClick={() =>
                        form.setValue(
                          "skills",
                          toggleItem(form.getValues("skills"), item),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Interests</p>
              <div className="flex flex-wrap gap-2">
                {suggestedInterests.map((item) => {
                  const selected = values.interests.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                      onClick={() =>
                        form.setValue(
                          "interests",
                          toggleItem(form.getValues("interests"), item),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                {...form.register("availability")}
                placeholder="Evenings + weekends"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {availabilityOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    values.availability === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                  onClick={() =>
                    form.setValue("availability", item, { shouldDirty: true })
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="block space-y-2">
              <Label htmlFor="lookingFor">Looking for</Label>
              <Input
                id="lookingFor"
                {...form.register("lookingFor")}
                placeholder="Collaborators for frontend + backend"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {lookingForOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    values.lookingFor === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                  onClick={() =>
                    form.setValue("lookingFor", item, { shouldDirty: true })
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">GitHub connection</p>
                <p className="text-xs text-muted-foreground">
                  {connections.githubConnected
                    ? "GitHub is already connected."
                    : "Connect GitHub for repository-linked activity."}
                </p>
              </div>
              {connections.githubConnected ? (
                <Badge variant="soft">Connected</Badge>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => loginWithProvider("github")}
                >
                  Connect
                  <FaGithub className="size-4" />
                </Button>
              )}
            </div>

            <label className="block space-y-2">
              <Label htmlFor="wakatimeApiKey">WakaTime API Key</Label>
              <Input
                id="wakatimeApiKey"
                {...form.register("wakatimeApiKey")}
                placeholder={
                  connections.wakatimeConnected
                    ? "Already connected"
                    : "Paste your WakaTime API key"
                }
              />
            </label>

            <p className="text-xs text-muted-foreground">
              We verify the key with the WakaTime API before marking this step
              complete.
            </p>
          </div>
        ) : null}

        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            disabled={
              onboardingMutation.isPending || (step === 1 && !canSubmitStepOne)
            }
            size="lg"
            className="w-full rounded-md h-12"
          >
            {submitLabel}
          </Button>

          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={skipStep}
              disabled={onboardingMutation.isPending}
              size="lg"
              className="w-full rounded-md h-12 text-base space-x-1 flex justify-center items-center px-6 font-mono"
            >
              Skip
            </Button>
          ) : null}
        </div>

        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </form>
    </div>
  );
}
