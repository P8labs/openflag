"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";

type Props = {
  initialBio: string;
  initialSkills: string[];
  initialInterests: string[];
  initialAvailability: string;
};

export function ProfileSetupForm({
  initialBio,
  initialSkills,
  initialInterests,
  initialAvailability,
}: Props) {
  const [bio, setBio] = useState(initialBio);
  const [skillsText, setSkillsText] = useState(initialSkills.join(", "));
  const [interestsText, setInterestsText] = useState(
    initialInterests.join(", "),
  );
  const [availability, setAvailability] = useState(initialAvailability);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card
      className="ui-panel mx-auto mt-8 w-full max-w-2xl p-6"
      variant="default"
    >
      <Card.Header className="space-y-2">
        <Card.Title className="text-xl font-medium tracking-tight sm:text-2xl">
          Finish profile to start swiping
        </Card.Title>
        <Card.Description className="max-w-2xl text-sm text-muted">
          Your GitHub data is imported automatically. Add intent and
          availability so matches are useful.
        </Card.Description>
      </Card.Header>
      <Card.Content className="grid gap-4 pt-2">
        <label className="grid gap-2 text-sm text-muted">
          Bio
          <textarea
            className="ui-input ui-textarea"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What kind of collaboration are you looking for?"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Skills
          <input
            className="ui-input"
            value={skillsText}
            onChange={(event) => setSkillsText(event.target.value)}
            placeholder="Comma separated: TypeScript, UI Design, Rust"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Interests
          <input
            className="ui-input"
            value={interestsText}
            onChange={(event) => setInterestsText(event.target.value)}
            placeholder="Comma separated: AI tools, SaaS, Open source"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Availability
          <input
            className="ui-input"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            placeholder="Example: 8 hrs/week evenings"
          />
        </label>
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-sm text-muted">
            Swiping unlocks once this profile is complete.
          </p>
          <Button
            className="rounded-xs"
            variant="outline"
            isDisabled={isSaving}
            onPress={async () => {
              setIsSaving(true);
              setMessage(null);

              const skills = skillsText
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
              const interests = interestsText
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);

              const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  bio,
                  availability,
                  skills,
                  interests,
                }),
              });

              if (!response.ok) {
                setMessage("Unable to save profile. Try again.");
                setIsSaving(false);
                return;
              }

              setMessage("Profile updated. Loading swipe feed...");
              window.location.reload();
            }}
          >
            {isSaving ? "Saving..." : "Save & Start Swiping"}
          </Button>
        </div>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </Card.Content>
    </Card>
  );
}
