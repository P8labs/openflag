"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

type WakaTimeProject = {
  id: string;
  name: string;
  timeLoggedSeconds: number;
  timeWorkedSeconds: number;
  humanReadableTotal: string | null;
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0h 0m";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function PostProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredRoles, setRequiredRoles] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [githubPrUrl, setGithubPrUrl] = useState("");
  const [autofillUrl, setAutofillUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [wakaProjects, setWakaProjects] = useState<WakaTimeProject[]>([]);
  const [selectedWakaProjectIds, setSelectedWakaProjectIds] = useState<string[]>([]);
  const [isLoadingWakaProjects, setIsLoadingWakaProjects] = useState(false);

  const selectedWakaProjects = useMemo(
    () => wakaProjects.filter((item) => selectedWakaProjectIds.includes(item.id)),
    [wakaProjects, selectedWakaProjectIds],
  );

  async function loadWakaProjects() {
    setIsLoadingWakaProjects(true);
    setMessage(null);
    try {
      const data = await apiFetch<{
        connected: boolean;
        projects: WakaTimeProject[];
      }>("/api/wakatime/projects");
      if (!data.connected) {
        setWakaProjects([]);
        setMessage("Connect WakaTime from right sidebar first.");
        return;
      }
      setWakaProjects(data.projects);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load WakaTime projects.",
      );
    } finally {
      setIsLoadingWakaProjects(false);
    }
  }

  async function autofillFromUrl() {
    if (!autofillUrl.trim()) {
      return;
    }
    setIsAutofilling(true);
    setMessage(null);
    try {
      const data = await apiFetch<{
        title: string | null;
        description: string | null;
        image: string | null;
      }>(`/api/url-preview?url=${encodeURIComponent(autofillUrl)}`);

      if (data.title && !title.trim()) {
        setTitle(data.title);
      }
      if (data.description && !description.trim()) {
        setDescription(data.description);
      }
      if (data.image && !image.trim()) {
        setImage(data.image);
      }
      if (!githubRepoUrl.trim() && autofillUrl.includes("github.com")) {
        setGithubRepoUrl(autofillUrl.trim());
      }
      setMessage("Autofill complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to autofill.");
    } finally {
      setIsAutofilling(false);
    }
  }

  return (
    <Card className="py-4">
      <CardHeader className="space-y-1 px-4">
        <CardTitle className="text-lg font-medium">Project details</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Share a concise summary, links, and optional WakaTime work signals.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSaving(true);
            setMessage(null);

            try {
              await apiFetch<{ project: { id: string } }>("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title,
                  description,
                  requiredRoles: parseCommaList(requiredRoles),
                  tags: parseCommaList(tags),
                  image: image.trim() || null,
                  video: video.trim() || null,
                  githubRepoUrl: githubRepoUrl.trim() || null,
                  githubPrUrl: githubPrUrl.trim() || null,
                  wakatimeProjectIds: selectedWakaProjectIds,
                }),
              });

              setMessage("Project posted.");
              router.push("/projects");
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Unable to post project.",
              );
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-title">Title</FieldLabel>
              <Input
                id="project-title"
                required
                placeholder="What are you building?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="project-description"
                  required
                  rows={5}
                  placeholder="State the problem, current progress, and what help you need."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {description.length}/5000
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="project-autofill-url">Autofill from URL</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="project-autofill-url"
                  placeholder="https://github.com/owner/repo or your project page"
                  value={autofillUrl}
                  onChange={(event) => setAutofillUrl(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    disabled={isAutofilling || !autofillUrl.trim()}
                    onClick={autofillFromUrl}
                  >
                    {isAutofilling ? "Filling..." : "Autofill"}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                Pull title, description, and preview image from a URL.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="project-github-repo">GitHub repository URL</FieldLabel>
              <Input
                id="project-github-repo"
                placeholder="https://github.com/org/repo"
                value={githubRepoUrl}
                onChange={(event) => setGithubRepoUrl(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-github-pr">GitHub PR URL</FieldLabel>
              <Input
                id="project-github-pr"
                placeholder="https://github.com/org/repo/pull/123"
                value={githubPrUrl}
                onChange={(event) => setGithubPrUrl(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-image">Image URL</FieldLabel>
              <Input
                id="project-image"
                placeholder="https://..."
                value={image}
                onChange={(event) => setImage(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-video">Video URL</FieldLabel>
              <Input
                id="project-video"
                placeholder="https://..."
                value={video}
                onChange={(event) => setVideo(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-required-roles">
                Required roles
              </FieldLabel>
              <Input
                id="project-required-roles"
                placeholder="Frontend, Backend, Design"
                value={requiredRoles}
                onChange={(event) => setRequiredRoles(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-tags">Tags</FieldLabel>
              <Input
                id="project-tags"
                placeholder="ai, opensource, infra"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </Field>

            <Separator />

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Link WakaTime projects</FieldLabel>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={loadWakaProjects}
                  disabled={isLoadingWakaProjects}
                >
                  {isLoadingWakaProjects ? "Loading..." : "Load projects"}
                </Button>
              </div>
              <FieldDescription>
                You can link multiple projects and include logged/worked time.
              </FieldDescription>
              {wakaProjects.length ? (
                <div className="mt-2 space-y-2 rounded-xs border border-border p-3">
                  {wakaProjects.slice(0, 20).map((project) => {
                    const checked = selectedWakaProjectIds.includes(project.id);
                    return (
                      <label
                        key={project.id}
                        className="flex cursor-pointer items-start gap-2 rounded-xs px-1 py-1"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(state) => {
                            const nextChecked = state === true;
                            setSelectedWakaProjectIds((current) => {
                              if (nextChecked) {
                                return [...new Set([...current, project.id])];
                              }
                              return current.filter((item) => item !== project.id);
                            });
                          }}
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block font-medium">{project.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            Logged {formatDuration(project.timeLoggedSeconds)} · Worked{" "}
                            {formatDuration(project.timeWorkedSeconds)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
              {selectedWakaProjects.length ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  Linked {selectedWakaProjects.length} WakaTime projects.
                </div>
              ) : null}
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Posting..." : "Post project"}
            </Button>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
