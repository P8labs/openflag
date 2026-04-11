import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  CalendarRange,
  CircleDot,
  FileText,
  GitPullRequest,
  HelpCircle,
  Image,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import {
  createPostComposerSchema,
  postCategories,
  type CreatePostComposerValues,
} from "@/lib/schemas";
import { DevlogProjectPicker, type DevlogProject } from "./DevlogProjectPicker";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn, formatDuration } from "@/lib/utils";

type ComposerState = {
  open: boolean;
  returnTo: string | null;
};

type PostComposerContextValue = {
  openComposer: (returnTo?: string) => void;
  closeComposer: () => void;
};

const PostComposerContext = createContext<PostComposerContextValue | null>(
  null,
);

type CreatePostResponse = {
  post: { id: string; content: string };
};

type TrackedTimeResponse = {
  minutes: number;
};

type ProjectListItem = DevlogProject & {
  status?: string;
};

type GitHubReferenceItem = {
  number: number;
  title: string;
  url: string;
};

type GitHubReferences = {
  owner: string;
  repo: string;
  prs: GitHubReferenceItem[];
  issues: GitHubReferenceItem[];
};

type GitHubSuggestionOption = {
  type: "pr" | "issue";
  value: string;
  label: string;
};

const categoryMeta = {
  devlog: {
    label: "Devlog",
    icon: MessageSquare,
    description: "Logged work with project linkage and tracked time.",
  },
  thought: {
    label: "Thought",
    icon: Sparkles,
    description: "Loose notes, reflections, or commentary.",
  },
  show: {
    label: "Show",
    icon: Image,
    description: "A thing you built and want to show off.",
  },
  event: {
    label: "Event",
    icon: CalendarRange,
    description: "A meetup, launch, talk, or date-specific update.",
  },
  ask: {
    label: "Ask",
    icon: HelpCircle,
    description: "A question with an optional quiz field.",
  },
} as const;

function toGitHubRepoBase(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) {
    return "";
  }

  try {
    const resolved = value.includes("://") ? value : `https://${value}`;
    const parsed = new URL(resolved);
    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      return "";
    }

    const [owner, repoRaw] = parsed.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2);
    const repo = (repoRaw ?? "").replace(/\.git$/i, "").trim();
    if (!owner || !repo) {
      return "";
    }

    return `https://github.com/${owner}/${repo}`;
  } catch {
    return "";
  }
}

function normalizeReferenceInput(
  value: string,
  githubUrl: string,
  kind: "pull" | "issues",
) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^#?\d+$/.test(trimmed)) {
    const base = toGitHubRepoBase(githubUrl);
    if (!base) {
      return trimmed.replace("#", "");
    }

    return `${base}/${kind}/${trimmed.replace("#", "")}`;
  }

  return trimmed;
}

function createTypedRef(type: string, url: string) {
  const normalizedType = type.trim().toLowerCase();
  const normalizedURL = url.trim();
  if (!normalizedType || !normalizedURL) {
    return "";
  }

  return `${normalizedType}:${normalizedURL}`;
}

function parseTypedRef(value: string) {
  const parts = value.split(":");
  if (parts.length < 2) {
    return null;
  }

  const type = parts[0]?.trim().toLowerCase() ?? "";
  const url = parts.slice(1).join(":").trim();
  if (!type || !url) {
    return null;
  }

  return { type, url };
}

function refTypeLabel(type: string) {
  switch (type) {
    case "pr":
      return "Pull Request";
    case "issue":
      return "Issue";
    case "article":
      return "Article";
    default:
      return type.toUpperCase();
  }
}

function refDisplayLabel(type: string, url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (type === "pr") {
      const number = parts[parts.length - 1];
      if (number) {
        return `#${number}`;
      }
    }

    if (type === "issue") {
      const number = parts[parts.length - 1];
      if (number) {
        return `#${number}`;
      }
    }

    if (type === "article") {
      return parts.length > 0
        ? `${parsed.hostname}/${parts[parts.length - 1]}`
        : parsed.hostname;
    }

    return parsed.hostname;
  } catch {
    return url;
  }
}

function buildAskQuizPayload(content: string, options: string[]) {
  const trimmedQuestion = content.trim();
  const normalizedOptions = options
    .map((value) => value.trim())
    .filter(Boolean);

  if (!trimmedQuestion && normalizedOptions.length === 0) {
    return "";
  }

  if (!trimmedQuestion || normalizedOptions.length < 2) {
    return trimmedQuestion;
  }

  return JSON.stringify({
    type: "mcq",
    question: trimmedQuestion,
    options: normalizedOptions,
  });
}

function PostComposerModal({
  state,
  onClose,
}: {
  state: ComposerState;
  onClose: () => void;
}) {
  const ANIMATION_MS = 180;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [shouldRender, setShouldRender] = useState(state.open);
  const [isClosing, setIsClosing] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () =>
      apiFetch<{ projects: ProjectListItem[] }>("/api/v1/projects"),
    enabled: state.open,
    staleTime: 60_000,
  });

  const devlogProjects = useMemo(() => {
    return (projectsQuery.data?.projects ?? []).filter((project) => {
      return (project.wakatimeIds ?? []).length > 0;
    });
  }, [projectsQuery.data?.projects]);

  const form = useForm<CreatePostComposerValues>({
    resolver: zodResolver(
      createPostComposerSchema,
    ) as Resolver<CreatePostComposerValues>,
    defaultValues: {
      content: "",
      category: "devlog",
      projectId: "",
      quiz: "",
      imageUrl: "",
      githubUrl: "",
      refUrls: [],
      wakatimeProjectIds: [],
    },
    mode: "onSubmit",
  });

  const values = form.watch();
  const selectedProjectId = form.watch("projectId") ?? "";
  const githubRepoUrl = values.githubUrl?.trim() ?? "";

  const selectedProject = useMemo(() => {
    return devlogProjects.find((project) => project.id === selectedProjectId);
  }, [devlogProjects, selectedProjectId]);

  const githubReferencesQuery = useQuery({
    queryKey: ["github-references", githubRepoUrl],
    queryFn: () =>
      apiFetch<{ references: GitHubReferences }>(
        `/api/v1/projects/github/references?repoUrl=${encodeURIComponent(githubRepoUrl)}`,
      ),
    enabled:
      state.open &&
      values.category === "devlog" &&
      toGitHubRepoBase(githubRepoUrl) !== "",
    staleTime: 60_000,
  });

  const trackedTimeQuery = useQuery({
    queryKey: ["project-tracked-time-preview", selectedProjectId],
    queryFn: () =>
      apiFetch<TrackedTimeResponse>(
        `/api/v1/projects/${selectedProjectId}/tracked-time`,
      ),
    enabled:
      state.open && values.category === "devlog" && selectedProjectId !== "",
    staleTime: 60_000,
  });

  const refSuggestions = useMemo<GitHubSuggestionOption[]>(() => {
    const pullRequests = (githubReferencesQuery.data?.references.prs ?? []).map(
      (pr) => ({
        type: "pr" as const,
        value: String(pr.number),
        label: `#${pr.number} ${pr.title}`,
      }),
    );

    const issues = (githubReferencesQuery.data?.references.issues ?? []).map(
      (issue) => ({
        type: "issue" as const,
        value: String(issue.number),
        label: `#${issue.number} ${issue.title}`,
      }),
    );

    return [...pullRequests, ...issues];
  }, [
    githubReferencesQuery.data?.references.prs,
    githubReferencesQuery.data?.references.issues,
  ]);

  useEffect(() => {
    if (!selectedProject?.githubUrl) {
      return;
    }

    form.setValue("githubUrl", selectedProject.githubUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, selectedProject?.githubUrl]);

  const submitMutation = useMutation({
    mutationFn: (payload: CreatePostComposerValues) =>
      apiFetch<CreatePostResponse>("/api/v1/posts", {
        method: "POST",
        body: (() => {
          const linkedProject = devlogProjects.find(
            (project) => project.id === payload.projectId?.trim(),
          );

          return JSON.stringify({
            content: payload.content.trim(),
            category: payload.category,
            projectId:
              payload.category === "devlog"
                ? payload.projectId?.trim() || ""
                : "",
            quiz:
              payload.category === "ask"
                ? buildAskQuizPayload(payload.content, quizOptions)
                : "",
            image: payload.imageUrl?.trim() || "",
            githubUrl:
              payload.category === "devlog"
                ? payload.githubUrl?.trim() || ""
                : "",
            refUrls:
              payload.category === "devlog"
                ? (payload.refUrls ?? [])
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
            wakatimeIds:
              payload.category === "devlog"
                ? (linkedProject?.wakatimeIds ?? [])
                : payload.wakatimeProjectIds,
          });
        })(),
      }),
    onSuccess: async (_data, payload) => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      const linkedProjectId = payload.projectId?.trim();
      if (payload.category === "devlog" && linkedProjectId) {
        await queryClient.invalidateQueries({
          queryKey: ["project", linkedProjectId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["project-tracked-time", linkedProjectId],
        });
      }
      form.reset({
        content: "",
        category: "devlog",
        projectId: "",
        quiz: "",
        imageUrl: "",
        githubUrl: "",
        refUrls: [],
        wakatimeProjectIds: [],
      });
      setQuizOptions(["", "", "", ""]);
      setImageOpen(false);
      onClose();
      if (state.returnTo) {
        navigate(state.returnTo);
      }
    },
  });

  function close() {
    form.reset({
      content: "",
      category: "devlog",
      projectId: "",
      quiz: "",
      imageUrl: "",
      githubUrl: "",
      refUrls: [],
      wakatimeProjectIds: [],
    });
    setQuizOptions(["", "", "", ""]);
    setImageOpen(false);
    onClose();
    if (state.returnTo) {
      navigate(state.returnTo);
    }
  }

  useEffect(() => {
    if (!state.open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state.open, state.returnTo, navigate]);

  function selectCategory(category: CreatePostComposerValues["category"]) {
    form.setValue("category", category, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (category !== "devlog") {
      form.setValue("projectId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("githubUrl", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("refUrls", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (category !== "ask") {
      form.setValue("quiz", "", { shouldDirty: true, shouldValidate: true });
      setQuizOptions(["", "", "", ""]);
    }
  }

  function setQuizOption(index: number, value: string) {
    setQuizOptions((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  function upsertRef(entry: string) {
    const normalized = entry.trim();
    if (!normalized) {
      return;
    }

    const current = form.getValues("refUrls") ?? [];
    if (current.includes(normalized)) {
      return;
    }

    form.setValue("refUrls", [...current, normalized], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function removeRef(entry: string) {
    const current = form.getValues("refUrls") ?? [];
    form.setValue(
      "refUrls",
      current.filter((item) => item !== entry),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function pickProject(projectId: string) {
    form.setValue("projectId", projectId, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const project = devlogProjects.find((item) => item.id === projectId);
    if (project?.githubUrl) {
      form.setValue("githubUrl", project.githubUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    setProjectPickerOpen(false);
  }

  useEffect(() => {
    if (state.open) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) {
      return;
    }

    setIsClosing(true);
    const timeout = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, ANIMATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.open, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const currentCategory = values.category;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] transition-opacity duration-200",
        isClosing ? "opacity-0" : "opacity-100",
      )}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-md border border-border bg-background p-4 shadow-lg transition-all duration-200",
          isClosing
            ? "translate-y-1 scale-[0.99] opacity-0"
            : "translate-y-0 scale-100 opacity-100",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-tight">
              Write a post
            </h2>
            <p className="text-sm text-muted-foreground">
              Capture devlogs, thoughts, event notes, or launch updates.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={close}>
            <X className="size-4" />
          </Button>
        </div>

        <form
          onSubmit={form.handleSubmit((payload) =>
            submitMutation.mutate(payload),
          )}
        >
          <Textarea
            id="content"
            {...form.register("content")}
            rows={6}
            className={cn(
              ["devlog", "ask"].includes(currentCategory) &&
                "rounded-none rounded-t-md",
            )}
            placeholder="Write the update, thought, or question..."
          />
          {form.formState.errors.content ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.content.message}
            </p>
          ) : null}

          {currentCategory === "devlog" ? (
            <section className="space-y-4 rounded-b-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Project link</p>
                  <p className="text-xs text-muted-foreground">
                    Attach the devlog to a project that already has WakaTime
                    ids.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => setProjectPickerOpen(true)}
                >
                  Select project
                </Button>
              </div>

              {values.projectId ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProject ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                      onClick={() => form.setValue("projectId", "")}
                    >
                      {selectedProject.title}
                      <span className="text-muted-foreground">
                        ({selectedProject.wakatimeIds.length} sources)
                      </span>
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No project selected yet.
                </p>
              )}

              {values.projectId ? (
                <div>
                  {trackedTimeQuery.isFetching ? (
                    <p className="text-xs text-muted-foreground">
                      Calculating tracked time to log...
                    </p>
                  ) : trackedTimeQuery.isError ? (
                    <p className="text-xs text-destructive">
                      Could not fetch tracked time for this project.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This devlog will log{" "}
                      <span className="font-medium text-foreground">
                        {formatDuration(trackedTimeQuery.data?.minutes ?? 0)}
                      </span>{" "}
                      of tracked time.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="gap-3">
                <label className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    {...form.register("githubUrl")}
                    placeholder="https://github.com/..."
                  />
                </label>
              </div>

              {refSuggestions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Reference suggestions</Label>
                  <Combobox<GitHubSuggestionOption>
                    items={refSuggestions}
                    itemToStringLabel={(item) => item.label}
                    itemToStringValue={(item) => `${item.type}-${item.value}`}
                    onValueChange={(item) => {
                      if (!item) {
                        return;
                      }

                      const normalizedURL = normalizeReferenceInput(
                        item.value,
                        values.githubUrl ?? "",
                        item.type === "pr" ? "pull" : "issues",
                      );
                      const entry = createTypedRef(item.type, normalizedURL);
                      if (entry) {
                        upsertRef(entry);
                      }
                    }}
                  >
                    <ComboboxInput
                      showClear
                      placeholder="Search PRs and issues"
                      className="w-full"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        No reference suggestions found.
                      </ComboboxEmpty>
                      <ComboboxList>
                        <ComboboxCollection>
                          {(item: GitHubSuggestionOption) => (
                            <ComboboxItem value={item}>
                              <span className="inline-flex items-center gap-2">
                                {item.type === "pr" ? (
                                  <GitPullRequest className="size-4 text-muted-foreground" />
                                ) : (
                                  <CircleDot className="size-4 text-muted-foreground" />
                                )}
                                {item.label}
                              </span>
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              ) : null}

              {githubReferencesQuery.isFetching ? (
                <p className="text-xs text-muted-foreground">
                  Loading GitHub issues and PRs for autocomplete...
                </p>
              ) : null}
              {githubReferencesQuery.isError ? (
                <p className="text-xs text-destructive">
                  Could not load GitHub issue/PR suggestions. Check GitHub URL
                  and GitHub account connection.
                </p>
              ) : null}

              {(values.refUrls ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(values.refUrls ?? []).map((entry) => {
                    const parsed = parseTypedRef(entry);
                    const type = parsed?.type ?? "ref";
                    const url = parsed?.url ?? entry;
                    const label = refDisplayLabel(type, url);

                    return (
                      <button
                        key={entry}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                        onClick={() => removeRef(entry)}
                        title={url}
                      >
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {type === "pr" ? (
                            <GitPullRequest className="size-3" />
                          ) : type === "issue" ? (
                            <CircleDot className="size-3" />
                          ) : type === "article" ? (
                            <FileText className="size-3" />
                          ) : (
                            <LinkIcon className="size-3" />
                          )}
                          {refTypeLabel(type)}
                        </span>
                        <span className="max-w-70 truncate font-medium">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>
          ) : null}

          {currentCategory === "ask" ? (
            <section className="space-y-3 rounded-b-md border border-border bg-background/40 p-3">
              <div>
                <p className="text-sm font-medium">Quiz</p>
                <p className="text-xs text-muted-foreground">
                  Add optional MCQ options. The post content above will be used
                  as the question.
                </p>
              </div>

              <div className="grid gap-2">
                {quizOptions.map((option, index) => (
                  <label key={`quiz-option-${index}`} className="space-y-2">
                    <Label htmlFor={`quizOption-${index}`}>
                      Option {String.fromCharCode(65 + index)}
                    </Label>
                    <Input
                      id={`quizOption-${index}`}
                      value={option}
                      onChange={(event) =>
                        setQuizOption(index, event.target.value)
                      }
                      placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                    />
                  </label>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Add at least 2 options to save this ask as an MCQ.
              </p>
            </section>
          ) : null}

          <div className="flex items-center justify-start gap-1 py-1 pt-2">
            <Select
              onValueChange={(v: any) => selectCategory(v)}
              defaultValue="devlog"
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {postCategories.map((category) => {
                    const meta = categoryMeta[category];
                    return (
                      <SelectItem value={category}>{meta.label}</SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={imageOpen || values.imageUrl ? "default" : "outline"}
                size="icon-sm"
                className="rounded-md"
                onClick={() => setImageOpen((current) => !current)}
              >
                <Image className="size-4" />
              </Button>
            </div>
          </div>

          {imageOpen || values.imageUrl ? (
            <section className="space-y-2 rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="imageUrl">Image attachment</Label>
                {values.imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.setValue("imageUrl", "")}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
              <Input
                id="imageUrl"
                {...form.register("imageUrl")}
                placeholder="Paste image URL"
              />
            </section>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Publishing..." : "Publish post"}
            </Button>
          </div>
        </form>

        <DevlogProjectPicker
          open={projectPickerOpen}
          search={projectSearch}
          onSearchChange={setProjectSearch}
          projects={devlogProjects}
          selectedProjectId={selectedProjectId}
          onSelectProject={pickProject}
          onClose={() => setProjectPickerOpen(false)}
        />
      </div>
    </div>
  );
}

export function PostComposerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ComposerState>({
    open: false,
    returnTo: null,
  });

  const value = useMemo<PostComposerContextValue>(
    () => ({
      openComposer: (returnTo?: string) => {
        setState({ open: true, returnTo: returnTo ?? null });
      },
      closeComposer: () => {
        setState((current) => ({ ...current, open: false, returnTo: null }));
      },
    }),
    [],
  );

  return (
    <PostComposerContext.Provider value={value}>
      {children}
      <PostComposerModal
        state={state}
        onClose={() =>
          setState((current) => ({ ...current, open: false, returnTo: null }))
        }
      />
    </PostComposerContext.Provider>
  );
}

export function usePostComposer() {
  const value = useContext(PostComposerContext);

  if (!value) {
    throw new Error("usePostComposer must be used inside PostComposerProvider");
  }

  return value;
}
