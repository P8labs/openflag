import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProfileFormData = {
  username: string;
  bio: string;
  skills: string[];
  interests: string[];
  availability: string;
  lookingFor: string;
};

type ProfileEditFormProps = {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  suggestedSkills: string[];
  suggestedInterests: string[];
  nextUsernameChangeDate: Date | null;
  isPending: boolean;
  message: string | null;
  onSubmit: () => void;
};

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function addUniqueItem(items: string[], value: string) {
  const normalized = normalizeTag(value);
  if (!normalized) {
    return items;
  }

  const exists = items.some(
    (item) => item.toLowerCase() === normalized.toLowerCase(),
  );
  if (exists) {
    return items;
  }

  return [...items, normalized];
}

function toggleItem(items: string[], value: string) {
  const normalized = normalizeTag(value);
  const hasItem = items.some(
    (item) => item.toLowerCase() === normalized.toLowerCase(),
  );

  if (hasItem) {
    return items.filter(
      (item) => item.toLowerCase() !== normalized.toLowerCase(),
    );
  }

  return [...items, normalized];
}

export function ProfileEditForm({
  formData,
  setFormData,
  suggestedSkills,
  suggestedInterests,
  nextUsernameChangeDate,
  isPending,
  message,
  onSubmit,
}: ProfileEditFormProps) {
  const [customSkill, setCustomSkill] = useState("");
  const [customInterest, setCustomInterest] = useState("");

  const addCustomSkill = () => {
    setFormData((current) => ({
      ...current,
      skills: addUniqueItem(current.skills, customSkill),
    }));
    setCustomSkill("");
  };

  const addCustomInterest = () => {
    setFormData((current) => ({
      ...current,
      interests: addUniqueItem(current.interests, customInterest),
    }));
    setCustomInterest("");
  };

  return (
    <section className="space-y-4 border-b border-border pb-5">
      <p className="text-base font-medium">Edit profile</p>

      <label className="block space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              username: event.target.value,
            }))
          }
          placeholder="openflag-builder"
        />
        <p className="text-xs text-muted-foreground">
          You can change username once every 7 days.
          {nextUsernameChangeDate
            ? ` Next change after ${nextUsernameChangeDate.toLocaleDateString()}.`
            : ""}
        </p>
      </label>

      <label className="block space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              bio: event.target.value,
            }))
          }
          rows={4}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">Skills</p>
        <div className="flex flex-wrap gap-2">
          {suggestedSkills.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                formData.skills.some(
                  (skill) => skill.toLowerCase() === item.toLowerCase(),
                )
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  skills: toggleItem(current.skills, item),
                }))
              }
            >
              {item}
            </button>
          ))}

          {formData.skills
            .filter(
              (item) =>
                !suggestedSkills.some(
                  (suggested) => suggested.toLowerCase() === item.toLowerCase(),
                ),
            )
            .map((item) => (
              <button
                key={`custom-skill-${item}`}
                type="button"
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    skills: toggleItem(current.skills, item),
                  }))
                }
              >
                {item}
              </button>
            ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={customSkill}
            onChange={(event) => setCustomSkill(event.target.value)}
            placeholder="Add custom skill"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomSkill();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomSkill}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Interests</p>
        <div className="flex flex-wrap gap-2">
          {suggestedInterests.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                formData.interests.some(
                  (interest) => interest.toLowerCase() === item.toLowerCase(),
                )
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  interests: toggleItem(current.interests, item),
                }))
              }
            >
              {item}
            </button>
          ))}

          {formData.interests
            .filter(
              (item) =>
                !suggestedInterests.some(
                  (suggested) => suggested.toLowerCase() === item.toLowerCase(),
                ),
            )
            .map((item) => (
              <button
                key={`custom-interest-${item}`}
                type="button"
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    interests: toggleItem(current.interests, item),
                  }))
                }
              >
                {item}
              </button>
            ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={customInterest}
            onChange={(event) => setCustomInterest(event.target.value)}
            placeholder="Add custom interest"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomInterest();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomInterest}>
            Add
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Input
            id="availability"
            value={formData.availability}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                availability: event.target.value,
              }))
            }
          />
        </label>

        <label className="block space-y-2">
          <Label htmlFor="lookingFor">Looking for</Label>
          <Input
            id="lookingFor"
            value={formData.lookingFor}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                lookingFor: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <Button
        type="button"
        className="h-11"
        disabled={isPending}
        onClick={onSubmit}
      >
        {isPending ? "Saving..." : "Save profile"}
      </Button>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </section>
  );
}
