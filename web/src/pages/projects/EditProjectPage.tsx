import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { FaGithub } from "react-icons/fa";
import { X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { connectWithProvider, useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import {
  WakaTimeProjectPicker,
  type WakaTimeProject,
} from "@/components/projects/WakaTimeProjectPicker";
import {
  normalizeProjectStatus,
  projectStatusLabel,
  projectStatusOptions,
} from "@/lib/project-status";
import {
  createProjectComposerSchema,
  type CreateProjectComposerValues,
} from "@/lib/schemas";

type ProjectDetail = {
  id: string;
  title: string;
  summary: string;
  description: string;
  logoUrl?: string | null;
  status?: string;
  url?: string | null;
  image?: string | null;
  video?: string | null;
  githubUrl?: string | null;
  wakatimeIds?: string[];
  tags?: string[];
};

function toggleItem(items: string[], value: string) {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }

  return [...items, value];
}

export default function EditProjectPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { connections } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState("");
  const [wakatimeSearch, setWakatimeSearch] = useState("");
  const [wakatimeModalOpen, setWakatimeModalOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () =>
      apiFetch<{ project: ProjectDetail }>(`/api/v1/projects/${projectId}`),
    enabled: Boolean(projectId),
  });

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
      logoUrl: "?",
      status: "dev",
      projectUrl: "",
      githubUrl: "",
      imageUrl: "",
      videoUrl: "",
      tags: [],
      wakatimeProjectIds: [],
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    const project = projectQuery.data?.project;
    if (!project) {
      return;
    }

    form.reset({
      title: project.title,
      summary: project.summary,
      description: project.description,
      logoUrl: project.logoUrl ?? "?",
      status: normalizeProjectStatus(project.status),
      projectUrl: project.url ?? "",
      githubUrl: project.githubUrl ?? "",
      imageUrl: project.image ?? "",
      videoUrl: project.video ?? "",
      tags: project.tags ?? [],
      wakatimeProjectIds: project.wakatimeIds ?? [],
    });
  }, [form, projectQuery.data?.project]);

  const values = form.watch();
  const project = projectQuery.data?.project;
  const wakatimeProjects = wakatimeProjectsQuery.data?.projects ?? [];

  const wakatimeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of wakatimeProjects) {
      map.set(item.id, item.name);
    }
    return map;
  }, [wakatimeProjects]);

  const updateProject = useMutation({
    mutationFn: (payload: CreateProjectComposerValues) =>
      apiFetch<{ project: { id: string; title: string } }>(
        `/api/v1/projects/${projectId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: payload.title.trim(),
            summary: payload.summary.trim(),
            description: payload.description.trim(),
            status: payload.status,
            logoUrl: payload.logoUrl?.trim() || "?",
            projectUrl: payload.projectUrl?.trim() || "",
            imageUrl: payload.imageUrl?.trim() || "",
            videoUrl: payload.videoUrl?.trim() || "",
            githubUrl: payload.githubUrl?.trim() || "",
            wakatimeIds: payload.wakatimeProjectIds,
            tags: payload.tags,
          }),
        },
      ),
    onSuccess: async (result) => {
      setMessage(`Project "${result.project.title}" updated.`);
      navigate(`/app/projects/${result.project.id}`);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    },
  });

  function toggleWakaTimeProject(projectIdValue: string) {
    form.setValue(
      "wakatimeProjectIds",
      toggleItem(form.getValues("wakatimeProjectIds"), projectIdValue),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
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

  const canSubmit = useMemo(() => {
    return (
      values.title.trim().length >= 2 &&
      values.summary.trim().length >= 8 &&
      values.description.trim().length >= 20
    );
  }, [values.description, values.summary, values.title]);

  if (projectQuery.isError) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
        <p className="text-sm text-destructive">
          {projectQuery.error instanceof Error
            ? projectQuery.error.message
            : "Unable to load project."}
        </p>
        <Button asChild variant="outline" className="w-fit rounded-md">
          <Link to="/app/projects">Back to projects</Link>
        </Button>
      </section>
    );
  }

  if (projectQuery.isLoading || !project) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="soft">{projectStatusLabel(project.status)}</Badge>
            <h1 className="mt-2 text-2xl font-semibold leading-tight">
              Edit Project
            </h1>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <Link to={`/app/projects/${project.id}`}>Back</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Update project details, status, media, and linked integrations.
        </p>
      </header>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((payload) => updateProject.mutate(payload))}
      >
        <section className="space-y-4 border-b border-border pb-5">
          <p className="text-sm font-medium">Core details</p>

          <label className="block space-y-2">
            <Label htmlFor="title">Project title *</Label>
            <Input id="title" {...form.register("title")} />
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
          </div>

          <label className="block space-y-2">
            <Label htmlFor="summary">One-line summary *</Label>
            <Input id="summary" {...form.register("summary")} />
          </label>

          <label className="block space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={5}
            />
          </label>
        </section>

        <section className="space-y-4 border-b border-border pb-5">
          <p className="text-sm font-medium">Links and media</p>

          <label className="block space-y-2">
            <Label htmlFor="logoUrl">Logo URL *</Label>
            <Input id="logoUrl" {...form.register("logoUrl")} />
            {form.formState.errors.logoUrl ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.logoUrl.message}
              </p>
            ) : null}
          </label>

          <label className="block space-y-2">
            <Label htmlFor="projectUrl">Project URL</Label>
            <Input id="projectUrl" {...form.register("projectUrl")} />
          </label>

          <label className="block space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input id="githubUrl" {...form.register("githubUrl")} />
          </label>

          <label className="block space-y-2">
            <Label htmlFor="imageUrl">Cover image URL</Label>
            <Input id="imageUrl" {...form.register("imageUrl")} />
          </label>

          <label className="block space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input id="videoUrl" {...form.register("videoUrl")} />
          </label>
        </section>

        <section className="space-y-4 border-b border-border pb-5">
          <p className="text-sm font-medium">Tags</p>

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
              placeholder="Add custom tag"
            />
            <Button type="button" variant="outline" onClick={addCustomTag}>
              Add tag
            </Button>
          </div>
        </section>

        <section className="space-y-4 border-b border-border pb-5">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">GitHub connection</p>
              <p className="text-xs text-muted-foreground">
                {connections.githubConnected
                  ? "GitHub is connected."
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
                  Select WakaTime projects to track lifetime time and compare it
                  against logged posts.
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
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                WakaTime not connected. Connect it in onboarding to enable time
                tracking.
              </p>
            )}
          </div>
        </section>

        <div className="space-y-2">
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || !canSubmit}
            className="w-full rounded-md text-base text-white"
          >
            {form.formState.isSubmitting ? "Saving..." : "Save project"}
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
