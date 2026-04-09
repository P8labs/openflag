"use client";

import { useState } from "react";

import { UiButton } from "@/components/ui/button";
import { UiCard } from "@/components/ui/card";
import { UiInput, UiTextArea } from "@/components/ui/field";

export function PostProjectForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredRoles, setRequiredRoles] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <>
      <UiCard className="p-4 sm:p-5">
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSaving(true);
            setMessage(null);

            const response = await fetch("/api/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description,
                requiredRoles: requiredRoles
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                tags: tags
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                image: image.trim() || null,
                video: video.trim() || null,
              }),
            });

            if (!response.ok) {
              setMessage("Unable to post project.");
              setIsSaving(false);
              return;
            }

            setMessage("Project posted.");
            setTitle("");
            setDescription("");
            setRequiredRoles("");
            setTags("");
            setImage("");
            setVideo("");
            setIsSaving(false);
          }}
        >
          <UiInput
            placeholder="Project title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <UiTextArea
            placeholder="Project description"
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <UiInput
            placeholder="Required roles (comma separated)"
            value={requiredRoles}
            onChange={(event) => setRequiredRoles(event.target.value)}
          />
          <UiInput
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <UiInput
            placeholder="Image URL (optional)"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />
          <UiInput
            placeholder="Video URL (optional)"
            value={video}
            onChange={(event) => setVideo(event.target.value)}
          />

          <UiButton isDisabled={isSaving} type="submit">
            {isSaving ? "Posting..." : "Post"}
          </UiButton>
        </form>
      </UiCard>

      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </>
  );
}
