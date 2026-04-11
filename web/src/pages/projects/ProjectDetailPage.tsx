import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLinkIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { projectStatusLabel } from "@/lib/project-status";

type ProjectPost = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    username: string;
  };
  githubUrl?: string | null;
  refUrls?: string[];
  devlogMinutes?: number;
};

type ProjectDetail = {
  id: string;
  title: string;
  summary: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    username: string;
  };
  status?: string;
  url?: string | null;
  image?: string | null;
  video?: string | null;
  githubUrl?: string | null;
  githubStars?: number;
  wakatimeIds?: string[];
  collaborators?: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  posts?: ProjectPost[];
  tags?: string[];
};

type TrackedTimeResponse = {
  minutes: number;
};

type MediaItem = {
  type: "image" | "video";
  src: string;
};

function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
      {children}
    </section>
  );
}

function MediaCarousel({
  items,
  title,
}: {
  items: MediaItem[];
  title: string;
}) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return null;
  }

  const active = items[index];

  return (
    <section className="space-y-3 border-b border-border pb-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">Media</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-md"
            onClick={() =>
              setIndex((current) => (current - 1 + items.length) % items.length)
            }
            disabled={items.length < 2}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {index + 1}/{items.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-md"
            onClick={() => setIndex((current) => (current + 1) % items.length)}
            disabled={items.length < 2}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-background/30">
        {active.type === "image" ? (
          <img
            src={active.src}
            alt={`${title} media ${index + 1}`}
            className="h-72 w-full object-cover"
          />
        ) : (
          <video
            className="h-72 w-full object-cover"
            controls
            src={active.src}
          ></video>
        )}
      </div>
    </section>
  );
}

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () =>
      apiFetch<{ project: ProjectDetail }>(`/api/v1/projects/${projectId}`),
    enabled: Boolean(projectId),
  });

  const project = projectQuery.data?.project;

  const wakatimeIds = project?.wakatimeIds ?? [];
  const collaborators = project?.collaborators ?? [];
  const linkedPosts = project?.posts ?? [];
  const tags = project?.tags ?? [];

  const trackedTimeQuery = useQuery({
    queryKey: ["project-tracked-time", projectId],
    queryFn: () =>
      apiFetch<TrackedTimeResponse>(
        `/api/v1/projects/${projectId}/tracked-time`,
      ),
    enabled: Boolean(projectId) && wakatimeIds.length > 0,
    staleTime: 60_000,
  });

  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!project) {
      return [];
    }

    const items: MediaItem[] = [];
    if (project.image) {
      items.push({ type: "image", src: project.image });
    }
    if (project.video) {
      items.push({ type: "video", src: project.video });
    }

    return items;
  }, [project]);

  if (projectQuery.isLoading) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </PageShell>
    );
  }

  if (projectQuery.isError) {
    const message =
      projectQuery.error instanceof Error
        ? projectQuery.error.message
        : "Unable to load project.";

    const notFound = message.toLowerCase().includes("not found");

    return (
      <PageShell>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">
            {notFound ? "Project not found" : "Unable to load project"}
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <Button asChild variant="outline" className="w-fit rounded-md">
          <Link to="/app/projects">
            <ArrowLeft className="size-4" />
            Back to projects
          </Link>
        </Button>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">
            Project not found
          </h1>
          <p className="text-sm text-muted-foreground">
            We could not find a project with this id.
          </p>
        </div>

        <Button asChild variant="outline" className="w-fit rounded-md">
          <Link to="/app/projects">
            <ArrowLeft className="size-4" />
            Back to projects
          </Link>
        </Button>
      </PageShell>
    );
  }

  const totalTrackedMinutes = trackedTimeQuery.data?.minutes ?? 0;
  const loggedDevlogMinutes = linkedPosts.reduce(
    (sum, post) => sum + (post.devlogMinutes ?? 0),
    0,
  );
  const notLoggedMinutes = Math.max(
    totalTrackedMinutes - loggedDevlogMinutes,
    0,
  );
  const isOwner = user?.id === project.owner.id;

  return (
    <PageShell>
      <header className="space-y-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" className="w-fit rounded-md px-2">
            <Link to="/app/projects">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>

          {isOwner ? (
            <Button asChild variant="outline" className="rounded-md">
              <Link to={`/app/projects/${project.id}/edit`}>Edit project</Link>
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">
            {project.title}
          </h1>
          <p className="text-sm text-muted-foreground">{project.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">{projectStatusLabel(project.status)}</Badge>
          <Badge variant="outline">
            Tracked {formatDuration(loggedDevlogMinutes)}
          </Badge>
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted space-x-1"
              >
                <ExternalLinkIcon className="size-3" /> <span>GitHub</span>
              </Badge>
            </a>
          ) : (
            <Badge variant="secondary">GitHub unavailable</Badge>
          )}
          {project.url ? (
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted space-x-1"
              >
                <ExternalLinkIcon className="size-3" /> <span>Project URL</span>
              </Badge>
            </a>
          ) : (
            <Badge variant="secondary">Project URL unavailable</Badge>
          )}
        </div>
      </header>

      <MediaCarousel items={mediaItems} title={project.title} />

      <section className="space-y-2 border-b border-border pb-5">
        <h2 className="text-base font-medium">Project Details</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      </section>

      {isOwner ? (
        <section className="space-y-2 border-b border-border pb-5">
          <h2 className="text-base font-medium">Integrations</h2>
          <div className="flex flex-wrap gap-2">
            {project.githubUrl ? (
              <Badge variant="outline">
                GitHub linked
                {typeof project.githubStars === "number"
                  ? ` · ${project.githubStars} stars`
                  : ""}
              </Badge>
            ) : (
              <Badge variant="secondary">GitHub not linked</Badge>
            )}

            {wakatimeIds.length > 0 ? (
              <Badge variant="soft">
                WakaTime linked ({wakatimeIds.length})
              </Badge>
            ) : (
              <Badge variant="secondary">WakaTime not linked</Badge>
            )}
          </div>

          {project.githubUrl ? (
            <p className="text-sm text-muted-foreground">
              GitHub:{" "}
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {project.githubUrl}
              </a>
            </p>
          ) : null}

          {wakatimeIds.length > 0 ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-background/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Time spent</p>
                  <p className="text-sm font-medium text-foreground">
                    {trackedTimeQuery.isLoading
                      ? "Loading..."
                      : formatDuration(totalTrackedMinutes)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Logged as devlog
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDuration(loggedDevlogMinutes)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Time not logged
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {trackedTimeQuery.isLoading
                      ? "Loading..."
                      : formatDuration(notLoggedMinutes)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                WakaTime is fetched first, then we compare tracked minutes with
                logged devlog minutes from linked posts.
              </p>

              {trackedTimeQuery.isError ? (
                <p className="text-xs text-destructive">
                  {trackedTimeQuery.error instanceof Error
                    ? trackedTimeQuery.error.message
                    : "Unable to fetch WakaTime tracked time."}
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2 border-b border-border pb-5">
        <h2 className="text-base font-medium">Collaborators</h2>
        {collaborators.length === 0 ? (
          <p className="text-sm text-muted-foreground">No collaborators yet.</p>
        ) : (
          <ul className="space-y-2">
            {collaborators.map((collab) => (
              <li
                key={collab.id}
                className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2"
              >
                <span className="text-sm font-medium">{collab.name}</span>
                <span className="text-xs text-muted-foreground">
                  @{collab.username}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-medium">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
