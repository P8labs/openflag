import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaGithub } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { connectWithProvider, useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import appConfig from "@/lib/config";
import { projectStatusLabel, projectStatusOptions } from "@/lib/project-status";
import {
  WakaTimeProjectPicker,
  type WakaTimeProject,
} from "@/components/projects/WakaTimeProjectPicker";
import {
  createProjectComposerSchema,
  type CreateProjectComposerValues,
} from "@/lib/schemas";

const suggestedTitles = [
  "Open source analytics dashboard",
  "AI copilots for docs",
  "Dev workflow optimizer",
  "Creator collaboration toolkit",
];

const suggestedTags = [
  "go",
  "typescript",
  "react",
  "developer-tools",
  "ai",
  "open-source",
  "productivity",
  "analytics",
];

function toggleItem(items: string[], value: string) {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }

  return [...items, value];
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { connections } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [autofillUrl, setAutofillUrl] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [wakatimeModalOpen, setWakatimeModalOpen] = useState(false);
  const [wakatimeSearch, setWakatimeSearch] = useState("");

  const wakatimeProjectsQuery = useQuery({
    queryKey: ["wakatime-projects"],
    queryFn: () =>
      apiFetch<{ projects: WakaTimeProject[] }>("/api/v1/me/wakatime/projects"),
    enabled: connections.wakatimeConnected,
    staleTime: 60_000,
  });

  const form = useForm<CreateProjectComposerValues>({
    resolver: zodResolver(
      createProjectComposerSchema,
    ) as Resolver<CreateProjectComposerValues>,
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      logo: "",
      projectUrl: "",
      githubUrl: "",
      image: "",
      videoUrl: "",
      tags: [],
      wakatimeProjectIds: [],
      status: "dev",
    },
    mode: "onSubmit",
  });

  const values = form.watch();

  const wakatimeProjects = wakatimeProjectsQuery.data?.projects ?? [];

  const wakatimeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of wakatimeProjects) {
      map.set(project.id, project.name);
    }
    return map;
  }, [wakatimeProjects]);

  const submitLabel = useMemo(() => {
    if (form.formState.isSubmitting) {
      return "Saving...";
    }

    return "Create project";
  }, [form.formState.isSubmitting]);

  const canSubmit = useMemo(() => {
    return (
      values.title.trim().length >= 2 &&
      values.summary.trim().length >= 8 &&
      values.description.trim().length >= 20
    );
  }, [values.description, values.summary, values.title]);

  const onSubmit = form.handleSubmit(async (formValues) => {
    setMessage(null);

    try {
      const projectUrl = formValues.projectUrl?.trim() || "";
      const imageUrl = formValues.image?.trim() || "";
      const videoUrl = formValues.videoUrl?.trim() || "";

      const payload = await apiFetch<{
        project: { id: string; title: string };
      }>("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify({
          title: formValues.title.trim(),
          summary: formValues.summary.trim(),
          description: formValues.description.trim(),
          status: formValues.status,
          logoUrl: formValues.logo?.trim() || "?",
          projectUrl,
          imageUrl,
          videoUrl,
          githubUrl: formValues.githubUrl?.trim() || "",
          wakatimeIds: formValues.wakatimeProjectIds,
          tags: formValues.tags,
        }),
      });

      setMessage(`Project \"${payload.project.title}\" created.`);
      navigate(`/app/projects/${payload.project.id}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create project.",
      );
    }
  });

  function runAutofillPreview() {
    setMessage(null);

    if (!appConfig.PROJECT_URL_AUTOFILL_ENABLED) {
      setMessage("Autofill is currently disabled by feature flag.");
      return;
    }

    if (!autofillUrl.trim()) {
      setMessage("Paste a project URL first.");
      return;
    }

    setMessage("Autofill request UI triggered.");
  }

  function addCustomTag() {
    const value = customTag.trim().toLowerCase();
    if (!value) {
      return;
    }

    form.setValue("tags", toggleItem(form.getValues("tags"), value), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setCustomTag("");
  }

  function toggleWakaTimeProject(projectId: string) {
    form.setValue(
      "wakatimeProjectIds",
      toggleItem(form.getValues("wakatimeProjectIds"), projectId),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight">
            Compose Project
          </h1>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <Link to="/app/projects">Back to projects</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Create a project with rich metadata, optional media, and connected
          GitHub/WakaTime signals.
        </p>
      </header>

      {appConfig.PROJECT_URL_AUTOFILL_ENABLED && (
        <section className="space-y-3 border-b border-border pb-5">
          <p className="text-sm font-medium">Quick Autofill</p>
          <p className="text-xs text-muted-foreground">Paste a project URL.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={autofillUrl}
              onChange={(event) => setAutofillUrl(event.target.value)}
              placeholder="https://github.com/owner/repo or project website"
            />
            <Button
              type="button"
              variant="outline"
              onClick={runAutofillPreview}
              disabled={!appConfig.PROJECT_URL_AUTOFILL_ENABLED}
              className="rounded-md"
            >
              Autofill data
            </Button>
          </div>
        </section>
      )}

      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-4 border-b border-border pb-5">
          <p className="text-sm font-medium">Core details</p>

          <label className="block space-y-2">
            <Label htmlFor="title">Project title *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Contributor graph for open source teams"
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </label>

          <div className="space-y-2">
            <Label>Project status *</Label>
            <div className="flex flex-wrap gap-2">
              {projectStatusOptions.map((option) => {
                const selected = values.status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                    onClick={() =>
                      form.setValue("status", option.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Current selection: {projectStatusLabel(values.status)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestedTitles.map((title) => (
              <button
                key={title}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40"
                onClick={() =>
                  form.setValue("title", title, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {title}
              </button>
            ))}
          </div>

          <label className="block space-y-2">
            <Label htmlFor="summary">One-line summary *</Label>
            <Input
              id="summary"
              {...form.register("summary")}
              placeholder="Track coding momentum and publish devlogs automatically"
            />
            {form.formState.errors.summary ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.summary.message}
              </p>
            ) : null}
          </label>

          <label className="block space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={5}
              placeholder="Describe what it does, who it's for, and current progress. Mention launch status, roadmap, and where collaborators can help."
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </label>
        </section>

        <section className="space-y-4 border-b border-border pb-5">
          <p className="text-sm font-medium">Links and media</p>

          <ImageUploadField
            label="Project logo"
            purpose="project-logo"
            value={values.logo ?? ""}
            hint="Upload a square logo for project cards and profile headers."
            onChange={(url) =>
              form.setValue("logo", url, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <label className="block space-y-2">
            <Label htmlFor="projectUrl">Project URL</Label>
            <Input
              id="projectUrl"
              {...form.register("projectUrl")}
              placeholder="https://yourproject.dev"
            />
          </label>

          <label className="block space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              {...form.register("githubUrl")}
              placeholder="https://github.com/org/repo"
            />
          </label>

          <ImageUploadField
            label="Cover image"
            purpose="project-image"
            value={values.image ?? ""}
            hint="Optional wide cover image for project detail pages."
            onChange={(url) =>
              form.setValue("image", url, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <label className="block space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              {...form.register("videoUrl")}
              placeholder="https://youtube.com/watch?v=..."
            />
          </label>
        </section>

        <section className="space-y-4 border-b border-border pb-5">
          <p className="text-sm font-medium">Tags</p>

          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => {
              const selected = values.tags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                  onClick={() =>
                    form.setValue(
                      "tags",
                      toggleItem(form.getValues("tags"), tag),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={customTag}
              onChange={(event) => setCustomTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="Add custom tag (e.g. fintech)"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomTag}
              className="rounded-md"
            >
              Add tag
            </Button>
          </div>

          {values.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {values.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                  onClick={() =>
                    form.setValue(
                      "tags",
                      values.tags.filter((item) => item !== tag),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  {tag}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 border-b border-border pb-5">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">GitHub connection</p>
              <p className="text-xs text-muted-foreground">
                {connections.githubConnected
                  ? "GitHub is connected. You can link repository metadata."
                  : "Connect GitHub to enrich project details and stars."}
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
                onClick={() => connectWithProvider("github")}
              >
                Connect
                <FaGithub className="size-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">WakaTime projects</p>
            {connections.wakatimeConnected ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Select one or more WakaTime project IDs to track unlogged time
                  and devlogs.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => setWakatimeModalOpen(true)}
                >
                  Select WakaTime projects
                </Button>

                {values.wakatimeProjectIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {values.wakatimeProjectIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                        onClick={() => toggleWakaTimeProject(id)}
                      >
                        {wakatimeNameById.get(id) ?? id}
                        <X className="size-3" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {wakatimeProjectsQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Loading WakaTime projects...
                  </p>
                ) : null}

                {wakatimeProjectsQuery.isError ? (
                  <p className="text-xs text-destructive">
                    {wakatimeProjectsQuery.error instanceof Error
                      ? wakatimeProjectsQuery.error.message
                      : "Unable to load WakaTime projects."}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                WakaTime not connected. Connect it in onboarding to enable
                project time tracking.
              </p>
            )}
          </div>
        </section>

        <div className="space-y-2">
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || !canSubmit}
            variant="default"
            className="w-full rounded-md text-base text-white"
          >
            {submitLabel}
          </Button>

          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
        </div>
      </form>

      <WakaTimeProjectPicker
        open={wakatimeModalOpen}
        search={wakatimeSearch}
        onSearchChange={setWakatimeSearch}
        projects={wakatimeProjects}
        selectedProjectIds={values.wakatimeProjectIds}
        onToggleProject={toggleWakaTimeProject}
        onClose={() => setWakatimeModalOpen(false)}
      />
    </section>
  );
}
