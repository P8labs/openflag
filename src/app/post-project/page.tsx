"use client";

import { useState } from "react";

import { PlusIcon } from "@/components/app-icons";
import { MobileNav } from "@/components/mobile-nav";

export default function PostProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredRoles, setRequiredRoles] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <section className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <PlusIcon className="size-4" />
          <p className="uppercase tracking-[0.2em]">Create</p>
        </div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          Post Project
        </h1>

        <form
          className="mt-4 space-y-3"
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
          <input
            className="w-full rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            placeholder="Project title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="min-h-28 w-full rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            placeholder="Project description"
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            className="w-full rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            placeholder="Required roles (comma separated)"
            value={requiredRoles}
            onChange={(event) => setRequiredRoles(event.target.value)}
          />
          <input
            className="w-full rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <input
            className="w-full rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            placeholder="Image URL (optional)"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />
          <input
            className="w-full rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            placeholder="Video URL (optional)"
            value={video}
            onChange={(event) => setVideo(event.target.value)}
          />

          <button
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Posting..." : "Post"}
          </button>
        </form>

        {message ? (
          <p className="mt-3 text-sm text-white/70">{message}</p>
        ) : null}

        <MobileNav />
      </section>
    </main>
  );
}
