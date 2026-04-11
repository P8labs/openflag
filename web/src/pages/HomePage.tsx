import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDot, GitMerge, Heart, Link2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { usePostComposer } from "@/components/posts/PostComposerProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { projectStatusLabel } from "@/lib/project-status";
import { cn, formatDuration } from "@/lib/utils";

type FeedProject = {
  id: string;
  title: string;
  summary: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  tags?: string[];
  owner?: {
    id: string;
    name: string;
    username: string;
  };
};

type FeedPost = {
  id: string;
  content: string;
  category?: string;
  quiz?: string | null;
  refUrls?: string[];
  devlogMinutes?: number;
  createdAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
  likes?: Array<{ id: string }>;
  comments?: FeedComment[];
  project?: {
    id: string;
    title: string;
  } | null;
};

type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    username: string;
  };
};

type FeedItem =
  | {
      type: "project";
      id: string;
      createdAt: string;
      project: FeedProject;
    }
  | {
      type: "post";
      id: string;
      createdAt: string;
      post: FeedPost;
    };

function timeLabel(value: string) {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) {
    return "Now";
  }

  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) {
    return "Now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return created.toLocaleDateString();
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

function refChipMeta(entry: string) {
  const parsed = parseTypedRef(entry);
  const type = parsed?.type ?? "ref";
  const url = parsed?.url ?? entry;

  try {
    const target = new URL(url);
    const segments = target.pathname.split("/").filter(Boolean);
    const tail = segments[segments.length - 1] ?? "";

    if (type === "pr") {
      return {
        label: tail ? `PR #${tail}` : "PR",
        icon: GitMerge,
        className: "bg-green-500/90 border-0 hover:bg-green-500/90 text-white",
      };
    }

    if (type === "issue") {
      return {
        label: tail ? `Issue #${tail}` : "Issue",
        icon: CircleDot,
        className:
          "border-amber-300/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15",
      };
    }

    return {
      label: target.hostname,
      icon: Link2,
      className:
        "border-border bg-background text-muted-foreground hover:text-foreground",
    };
  } catch {
    return {
      label: type.toUpperCase(),
      icon: Link2,
      className: "border-border bg-background text-muted-foreground",
    };
  }
}

function shouldAutoOpenComments(postID: string, count: number) {
  if (count <= 3) {
    return false;
  }

  let hash = 0;
  for (let index = 0; index < postID.length; index += 1) {
    hash = (hash * 31 + postID.charCodeAt(index)) % 9973;
  }

  return hash % 2 === 0;
}

function quizSummary(quiz?: string | null) {
  if (!quiz) {
    return "";
  }

  try {
    const parsed = JSON.parse(quiz) as {
      type?: string;
      options?: unknown[];
    };
    if (parsed?.type === "mcq") {
      const count = Array.isArray(parsed.options) ? parsed.options.length : 0;
      return count > 0 ? `Quiz · MCQ (${count})` : "Quiz · MCQ";
    }
  } catch {
    return "Quiz";
  }

  return "Quiz";
}

function PostComments({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange?: (count: number) => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () =>
      apiFetch<{ comments: FeedComment[] }>(`/api/v1/posts/${postId}/comments`),
  });

  useEffect(() => {
    if (commentsQuery.data?.comments && onCountChange) {
      onCountChange(commentsQuery.data.comments.length);
    }
  }, [commentsQuery.data?.comments, onCountChange]);

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ comment: FeedComment }>(`/api/v1/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({
        queryKey: ["post-comments", postId],
      });
    },
  });

  return (
    <div className="space-y-3 border-l border-border pl-4">
      <form
        className="flex items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const content = draft.trim();
          if (!content) {
            return;
          }
          commentMutation.mutate(content);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a comment"
          className="h-9 rounded-none rounded-l-md"
        />
        <Button
          className="rounded-none rounded-r-md h-9"
          type="submit"
          size="sm"
          disabled={commentMutation.isPending}
        >
          {commentMutation.isPending ? "Sending..." : "Send"}
        </Button>
      </form>

      {commentMutation.isError ? (
        <p className="text-xs text-destructive">
          {commentMutation.error instanceof Error
            ? commentMutation.error.message
            : "Could not post comment."}
        </p>
      ) : null}

      {commentsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : null}

      {commentsQuery.isError ? (
        <p className="text-xs text-destructive">
          {commentsQuery.error instanceof Error
            ? commentsQuery.error.message
            : "Could not load comments."}
        </p>
      ) : null}

      {!commentsQuery.isLoading && !commentsQuery.isError ? (
        <ul className="space-y-2">
          {(commentsQuery.data?.comments ?? []).map((comment) => (
            <li key={comment.id} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {comment.user?.name ?? user?.name ?? "User"} ·{" "}
                {timeLabel(comment.createdAt)}
              </p>
              <p className="text-sm text-foreground">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const { openComposer } = usePostComposer();
  const { user } = useAuth();
  const [commentPanel, setCommentPanel] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["posts"],
    queryFn: () => apiFetch<{ posts: FeedPost[] }>("/api/v1/posts"),
    staleTime: 30_000,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{ projects: FeedProject[] }>("/api/v1/projects"),
    staleTime: 30_000,
  });

  const feed = useMemo<FeedItem[]>(() => {
    const postItems: FeedItem[] = (postsQuery.data?.posts ?? []).map(
      (post) => ({
        type: "post",
        id: `post-${post.id}`,
        createdAt: post.createdAt,
        post,
      }),
    );

    const projectItems: FeedItem[] = (projectsQuery.data?.projects ?? []).map(
      (project) => ({
        type: "project",
        id: `project-${project.id}`,
        createdAt: project.createdAt,
        project,
      }),
    );

    return [...postItems, ...projectItems].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [postsQuery.data?.posts, projectsQuery.data?.projects]);

  const isLoading = postsQuery.isLoading || projectsQuery.isLoading;
  const hasError = postsQuery.isError || projectsQuery.isError;

  const likeMutation = useMutation({
    mutationFn: (postID: string) =>
      apiFetch<{ post: FeedPost; liked: boolean }>(
        `/api/v1/posts/${postID}/like`,
        {
          method: "POST",
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-3 py-5 lg:px-6 lg:py-6">
      <header className="space-y-2 border-b border-border pb-4">
        <h1 className="text-xl font-semibold leading-tight">Home Feed</h1>
        <p className="text-sm text-muted-foreground">
          Mixed stream of posts and projects from your workspace.
        </p>
      </header>

      <section className="border-b border-border pb-4">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2 text-left transition-colors hover:bg-background/70"
          onClick={() => openComposer("/app")}
        >
          <span className="text-sm text-muted-foreground">
            {user
              ? `What are you building today, ${user.name.split(" ")[0]}?`
              : "Share a devlog, thought, or question"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs text-foreground",
              buttonVariants({ variant: "default" }),
            )}
          >
            Compose
          </span>
        </button>
      </section>

      <section className="space-y-2">
        {isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Loading feed...</p>
        ) : null}

        {hasError ? (
          <p className="py-4 text-sm text-destructive">
            {postsQuery.error instanceof Error
              ? postsQuery.error.message
              : projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : "Could not load feed."}
          </p>
        ) : null}

        {!isLoading && !hasError && feed.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Feed is empty. Start by sharing your first update.
          </p>
        ) : null}

        {!isLoading && !hasError && feed.length > 0 ? (
          <ul className="divide-y divide-border">
            {feed.map((item) => {
              if (item.type === "project") {
                const project = item.project;
                return (
                  <li key={item.id} className="space-y-2 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar className="mt-0.5 size-10 border border-border">
                          {project.logoUrl && project.logoUrl !== "?" ? (
                            <AvatarImage
                              src={project.logoUrl}
                              alt={project.title}
                            />
                          ) : null}
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="soft">Project</Badge>
                            <span className="font-medium text-foreground">
                              {project.owner?.name ?? "Unknown"}
                            </span>
                            <span className="text-muted-foreground">
                              @{project.owner?.username ?? "user"}
                            </span>
                          </div>

                          <Link
                            to={`/app/projects/${project.id}`}
                            className="block truncate text-base font-medium text-foreground hover:text-primary"
                          >
                            {project.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {project.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        <Badge variant="outline">
                          {projectStatusLabel(project.status)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {timeLabel(project.createdAt)}
                        </span>
                      </div>
                    </div>
                    {(project.tags ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(project.tags ?? []).slice(0, 4).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              }

              const post = item.post;
              const likeCount = post.likes?.length ?? 0;
              const isLikedByCurrentUser = Boolean(
                user &&
                (post.likes ?? []).some(
                  (likedUser) => likedUser.id === user.id,
                ),
              );
              const commentCount =
                commentCounts[post.id] ?? post.comments?.length ?? 0;
              const commentsOpen =
                commentPanel[post.id] ??
                shouldAutoOpenComments(post.id, commentCount);
              const refs = post.refUrls ?? [];
              const quizLabel = quizSummary(post.quiz);

              return (
                <li key={item.id} className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="mt-0.5 size-10 border border-border">
                        {post.author?.image ? (
                          <AvatarImage
                            src={post.author.image}
                            alt={post.author?.username ?? "user"}
                          />
                        ) : (
                          <AvatarFallback>
                            {(post.author?.name ?? "U")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-medium text-foreground">
                          {post.author?.name ?? "Unknown"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{post.author?.username ?? "user"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <Badge variant="soft">{post.category ?? "post"}</Badge>
                      <span className="text-muted-foreground">
                        {timeLabel(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {post.content}
                  </p>

                  {refs.length > 0 ||
                  typeof post.devlogMinutes === "number" ||
                  quizLabel ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {refs.length > 0
                        ? refs.slice(0, 3).map((entry) => {
                            const parsed = parseTypedRef(entry);
                            const url = parsed?.url ?? entry;
                            const meta = refChipMeta(entry);
                            const Icon = meta.icon;

                            return (
                              <a
                                key={entry}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors",
                                  meta.className,
                                )}
                                title={url}
                              >
                                <Icon className="size-3.5" />
                                {meta.label}
                              </a>
                            );
                          })
                        : null}
                      {typeof post.devlogMinutes === "number" ? (
                        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5">
                          Tracked {formatDuration(post.devlogMinutes)}
                        </span>
                      ) : null}
                      {quizLabel ? (
                        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5">
                          {quizLabel}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => likeMutation.mutate(post.id)}
                        disabled={likeMutation.isPending}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
                          isLikedByCurrentUser
                            ? "text-rose-500"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Heart
                          className={cn(
                            "size-4",
                            isLikedByCurrentUser && "fill-current",
                          )}
                        />
                        <span>{likeCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCommentPanel((current) => ({
                            ...current,
                            [post.id]: !(current[post.id] ?? false),
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <MessageCircle className="size-4" />
                        <span>{commentCount}</span>
                      </button>
                    </div>

                    {post.project ? (
                      <Link
                        to={`/app/projects/${post.project.id}`}
                        className="inline-flex max-w-45 items-center truncate rounded-full border border-border px-2.5 py-1 text-xs text-primary hover:bg-primary/5"
                      >
                        {post.project.title}
                      </Link>
                    ) : null}
                  </div>

                  {commentsOpen ? (
                    <PostComments
                      postId={post.id}
                      onCountChange={(count) =>
                        setCommentCounts((current) => ({
                          ...current,
                          [post.id]: count,
                        }))
                      }
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </section>
  );
}
