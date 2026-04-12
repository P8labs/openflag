import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { projectStatusLabel } from "@/lib/project-status";

import type { FeedProject } from "./types";
import { timeLabel } from "./utils";

type ProjectFeedItemProps = {
  id: string;
  project: FeedProject;
  canStarProject: boolean;
  projectStarred: boolean;
  starPending: boolean;
  starError?: string | null;
  onStar: (projectId: string) => void;
};

export function ProjectFeedItem({
  id,
  project,
  canStarProject,
  projectStarred,
  starPending,
  starError,
  onStar,
}: ProjectFeedItemProps) {
  const hasMediaPreview = Boolean(project.image ?? project.video);
  const ownerInitial = (project.owner?.name ?? "U").slice(0, 1).toUpperCase();

  return (
    <li key={id} className="space-y-3 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="mt-0.5 size-10 border border-border">
            {project?.logoUrl ? (
              <AvatarImage src={project.logoUrl} alt={project.title} />
            ) : (
              <AvatarFallback>{ownerInitial}</AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0 leading-tight">
            <Link
              to={`/app/projects/${project.id}`}
              className="block min-w-0 truncate text-base font-medium text-foreground hover:text-primary"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {project.title} by {project.owner?.name ?? "Unknown"}
              </p>
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              <Link
                to={`/${project.owner?.username ?? "user"}`}
                className="hover:text-foreground hover:underline"
              >
                @{project.owner?.username ?? "user"}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs">
          <Badge variant="outline">{projectStatusLabel(project.status)}</Badge>
          <span className="text-muted-foreground">
            {timeLabel(project.createdAt)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.summary}
        </p>
      </div>

      {hasMediaPreview ? (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-background/40">
          {project.image ? (
            <img
              src={project.image}
              alt={`${project.title} media preview`}
              className="h-full w-full object-contain"
            />
          ) : (
            <video
              src={project.video ?? undefined}
              className="h-full w-full object-contain"
              controls
              preload="metadata"
            />
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {canStarProject ? (
            <button
              type="button"
              onClick={() => onStar(project.id)}
              disabled={projectStarred || starPending}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
                projectStarred
                  ? "text-yellow-500"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Star
                className={cn("size-4", projectStarred && "fill-current")}
              />
            </button>
          ) : null}
        </div>
        {(project.tags ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(project.tags ?? []).slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {starError ? (
        <p className="text-xs text-destructive">{starError}</p>
      ) : null}
    </li>
  );
}
