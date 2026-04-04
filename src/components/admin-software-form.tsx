"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SOFTWARE_STATUSES,
  SOFTWARE_TYPES,
  slugify,
  type SoftwareStatusValue,
  type SoftwareTypeValue,
} from "@/lib/software-meta";

type FormValues = {
  name: string;
  type: SoftwareTypeValue;
  slug: string;
  location: string;
  description: string;
  logoUrl: string;
  urls: string;
  status: SoftwareStatusValue;
};

const emptyValues: FormValues = {
  name: "",
  type: "WEB",
  slug: "",
  location: "",
  description: "",
  logoUrl: "",
  urls: '{\n  "home": "https://example.com"\n}',
  status: "PRE_REVIEWED",
};

export function AdminSoftwareForm({
  mode,
  submitUrl,
  initialValues,
}: {
  mode: "create" | "edit";
  submitUrl: string;
  initialValues?: Partial<FormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    ...emptyValues,
    ...initialValues,
    type: initialValues?.type ?? "WEB",
    status: initialValues?.status ?? "PRE_REVIEWED",
    urls: initialValues?.urls ?? emptyValues.urls,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setValues((current) => ({
        ...current,
        slug: slugify(current.name),
      }));
    }
  }, [slugTouched, values.name]);

  function updateField<K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const urls = JSON.parse(values.urls) as unknown;

      const response = await fetch(submitUrl, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          urls,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        id?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save software");
      }

      router.push(`/admin/software/${payload.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save software",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6 shadow-none"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Signal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={values.type}
            onChange={(event) =>
              updateField("type", event.target.value as SoftwareTypeValue)
            }
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {SOFTWARE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              updateField("slug", event.target.value);
            }}
            placeholder="signal"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={values.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="https://signal.org"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={values.logoUrl}
            onChange={(event) => updateField("logoUrl", event.target.value)}
            placeholder="https://.../logo.svg"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about what the software does."
            rows={4}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="urls">URLs JSON</Label>
          <Textarea
            id="urls"
            value={values.urls}
            onChange={(event) => updateField("urls", event.target.value)}
            rows={6}
            placeholder='{ "home": "https://...", "privacy": "https://.../privacy" }'
          />
        </div>

        {mode === "edit" ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={values.status}
              onChange={(event) =>
                updateField("status", event.target.value as SoftwareStatusValue)
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {SOFTWARE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving"
            : mode === "create"
              ? "Create software"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
