import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { FeedBoundary } from "@/components/feed/FeedBoundary";
import { PostFeedItem } from "@/components/feed/PostFeedItem";
import { ProjectFeedItem } from "@/components/feed/ProjectFeedItem";
import type { FeedItem, FeedPost, FeedProject } from "@/components/feed/types";
import { shouldAutoOpenComments } from "@/components/feed/utils";
import { usePostComposer } from "@/components/posts/PostComposerProvider";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const HOME_POSTS_QUERY_KEY = ["home-feed", "posts"] as const;
  const HOME_PROJECTS_QUERY_KEY = ["home-feed", "projects"] as const;
  const { openComposer } = usePostComposer();
  const { user, connections } = useAuth();
  const [commentPanel, setCommentPanel] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );
  const [starredProjects, setStarredProjects] = useState<
    Record<string, boolean>
  >({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const PAGE_SIZE_POSTS = 10;
  const PAGE_SIZE_PROJECTS = 5;

  const postsQuery = useInfiniteQuery({
    queryKey: HOME_POSTS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      apiFetch<{ posts: FeedPost[]; hasMore: boolean; nextOffset: number }>(
        `/api/v1/posts?limit=${PAGE_SIZE_POSTS}&offset=${pageParam}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    staleTime: 30_000,
  });

  const projectsQuery = useInfiniteQuery({
    queryKey: HOME_PROJECTS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      apiFetch<{
        projects: FeedProject[];
        hasMore: boolean;
        nextOffset: number;
      }>(`/api/v1/projects?limit=${PAGE_SIZE_PROJECTS}&offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    staleTime: 30_000,
  });

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [postsQuery.data?.pages],
  );

  const projects = useMemo(
    () => projectsQuery.data?.pages.flatMap((page) => page.projects) ?? [],
    [projectsQuery.data?.pages],
  );

  const feed = useMemo<FeedItem[]>(() => {
    const postItems: FeedItem[] = posts.map((post) => ({
      type: "post",
      id: `post-${post.id}`,
      createdAt: post.createdAt,
      post,
    }));

    const projectItems: FeedItem[] = projects.map((project) => ({
      type: "project",
      id: `project-${project.id}`,
      createdAt: project.createdAt,
      project,
    }));

    return [...postItems, ...projectItems].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, projects]);

  const isLoading = postsQuery.isLoading || projectsQuery.isLoading;
  const postsErrorMessage =
    postsQuery.error instanceof Error ? postsQuery.error.message : null;
  const projectsErrorMessage =
    projectsQuery.error instanceof Error ? projectsQuery.error.message : null;
  const canLoadMore =
    Boolean(postsQuery.hasNextPage) || Boolean(projectsQuery.hasNextPage);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !canLoadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }

        if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
          void postsQuery.fetchNextPage();
        }

        if (projectsQuery.hasNextPage && !projectsQuery.isFetchingNextPage) {
          void projectsQuery.fetchNextPage();
        }
      },
      {
        rootMargin: "300px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [
    canLoadMore,
    postsQuery.fetchNextPage,
    postsQuery.hasNextPage,
    postsQuery.isFetchingNextPage,
    projectsQuery.fetchNextPage,
    projectsQuery.hasNextPage,
    projectsQuery.isFetchingNextPage,
  ]);

  const likeMutation = useMutation({
    mutationFn: (postID: string) =>
      apiFetch<{ post: FeedPost; liked: boolean }>(
        `/api/v1/posts/${postID}/like`,
        {
          method: "POST",
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: HOME_POSTS_QUERY_KEY });
    },
  });

  const quizVoteMutation = useMutation({
    mutationFn: ({
      postID,
      optionIndex,
    }: {
      postID: string;
      optionIndex: number;
    }) =>
      apiFetch<{ post: FeedPost }>(`/api/v1/posts/${postID}/quiz-vote`, {
        method: "POST",
        body: JSON.stringify({ optionIndex }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: HOME_POSTS_QUERY_KEY });
    },
  });

  const starProjectMutation = useMutation({
    mutationFn: (projectID: string) =>
      apiFetch<{ starred: boolean }>(`/api/v1/projects/${projectID}/star`, {
        method: "POST",
      }),
    onSuccess: (_data, projectID) => {
      setStarredProjects((current) => ({
        ...current,
        [projectID]: true,
      }));
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
        <FeedBoundary
          postsLoading={postsQuery.isLoading}
          projectsLoading={projectsQuery.isLoading}
          postsErrorMessage={postsErrorMessage}
          projectsErrorMessage={projectsErrorMessage}
          feedLength={feed.length}
        />

        {feed.length > 0 ? (
          <ul className="divide-y divide-border">
            {feed.map((item) => {
              if (item.type === "project") {
                const project = item.project;
                const canStarProject = Boolean(
                  connections.githubConnected && project.githubUrl,
                );
                const projectStarred = Boolean(
                  project.githubStarred || starredProjects[project.id],
                );

                return (
                  <ProjectFeedItem
                    id={item.id}
                    project={project}
                    canStarProject={canStarProject}
                    projectStarred={projectStarred}
                    starPending={
                      starProjectMutation.isPending &&
                      starProjectMutation.variables === project.id
                    }
                    starError={
                      starProjectMutation.isError &&
                      starProjectMutation.variables === project.id
                        ? starProjectMutation.error instanceof Error
                          ? starProjectMutation.error.message
                          : "Unable to star this project."
                        : null
                    }
                    onStar={(projectId) =>
                      starProjectMutation.mutate(projectId)
                    }
                  />
                );
              }

              const post = item.post;
              const commentCount =
                commentCounts[post.id] ?? post.comments?.length ?? 0;
              const commentsOpen =
                commentPanel[post.id] ??
                shouldAutoOpenComments(post.id, commentCount);

              return (
                <PostFeedItem
                  id={item.id}
                  post={post}
                  currentUserId={user?.id}
                  commentCount={commentCount}
                  commentPanelOpen={commentsOpen}
                  likePending={likeMutation.isPending}
                  quizPending={quizVoteMutation.isPending}
                  quizError={
                    quizVoteMutation.isError
                      ? quizVoteMutation.error instanceof Error
                        ? quizVoteMutation.error.message
                        : "Unable to submit vote."
                      : null
                  }
                  onLike={(postId) => likeMutation.mutate(postId)}
                  onVoteQuiz={(postId, optionIndex) =>
                    quizVoteMutation.mutate({ postID: postId, optionIndex })
                  }
                  onToggleComments={(postId) =>
                    setCommentPanel((current) => ({
                      ...current,
                      [postId]: !(current[postId] ?? false),
                    }))
                  }
                  onCommentCountChange={(postId, count) =>
                    setCommentCounts((current) => {
                      if (current[postId] === count) {
                        return current;
                      }

                      return {
                        ...current,
                        [postId]: count,
                      };
                    })
                  }
                />
              );
            })}
          </ul>
        ) : null}

        {canLoadMore || (isLoading && feed.length > 0) ? (
          <div
            ref={loadMoreRef}
            className="py-4 text-center text-xs text-muted-foreground"
          >
            {isLoading ? "Loading updates..." : "Loading more updates..."}
          </div>
        ) : null}
      </section>
    </section>
  );
}
