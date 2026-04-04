"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SOFTWARE_TYPES,
  slugify,
  type SoftwareTypeValue,
} from "@/lib/software-meta";

export function SuggestSoftwareDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<SoftwareTypeValue>("WEB");
  const [slug, setSlug] = useState("");
  const [urls, setUrls] = useState('{\n  "home": "https://example.com"\n}');
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type,
          slug,
          urls: JSON.parse(urls),
          description,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save suggestion");
      }

      setOpen(false);
      setName("");
      setType("WEB");
      setSlug("");
      setUrls('{\n  "home": "https://example.com"\n}');
      setDescription("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save suggestion",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full border-border/70 bg-background shadow-none"
        >
          Suggest Software
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Suggest a software entry</DialogTitle>
          <DialogDescription>
            Keep it concise. We review and queue it for analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="suggest-name">Name</Label>
            <Input
              id="suggest-name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                setSlug((current) => (current ? current : slugify(nextName)));
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as SoftwareTypeValue)
                }
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {SOFTWARE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggest-slug">Slug</Label>
              <Input
                id="suggest-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggest-urls">URLs JSON</Label>
            <Textarea
              id="suggest-urls"
              value={urls}
              onChange={(event) => setUrls(event.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggest-description">Description</Label>
            <Textarea
              id="suggest-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Submitting" : "Submit suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
