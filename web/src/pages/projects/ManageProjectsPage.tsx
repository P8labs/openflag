import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Plus, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { projectStatusLabel } from "@/lib/project-status";
import { cn } from "@/lib/utils";

type ProjectListItem = {
  id: string;
  title: string;
  summary: string;
  tags?: string[];
  githubUrl?: string | null;
  wakatimeIds?: string[];
  status?: string;
  updatedAt: string;
};

export default function ManageProjectsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () =>
      apiFetch<{ projects: ProjectListItem[] }>("/api/v1/projects"),
  });

  const projects = projectsQuery.data?.projects ?? [];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const tags = project.tags ?? [];

      const normalizedQuery = query.trim().toLowerCase();
      const byQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.summary.toLowerCase().includes(normalizedQuery) ||
        tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return byQuery;
    });
  }, [projects, query]);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">
            Manage Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Compose updates, filter focus, and track active work in one lane.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          onClick={() => navigate("/app/projects/compose")}
        >
          <Plus className="size-4" />
          Compose project
        </Button>
      </header>

      <section className="space-y-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-medium">
            <Filter className="size-4" />
            Filter Projects
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, summary, or tag"
              className="pl-9"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium">Project List</h2>
          <p className="text-sm text-muted-foreground">
            Sorted by latest activity. Use filters to narrow your active queue.
          </p>
        </div>

        {projectsQuery.isLoading ? (
          <div className="rounded-md border border-border bg-background/60 px-4 py-8 text-sm text-muted-foreground">
            Loading projects...
          </div>
        ) : null}

        {projectsQuery.isError ? (
          <div className="rounded-md border border-destructive/40 bg-background/60 px-4 py-8 text-sm text-destructive">
            {projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : "Unable to load projects."}
          </div>
        ) : null}

        {!projectsQuery.isLoading &&
        !projectsQuery.isError &&
        filteredProjects.length === 0 ? (
          <div className="rounded-md border border-border bg-background/60 px-4 py-8 text-sm text-muted-foreground">
            No projects match your filters.
          </div>
        ) : null}

        {!projectsQuery.isLoading &&
        !projectsQuery.isError &&
        filteredProjects.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border bg-background/50">
            {filteredProjects.map((project) => (
              <li key={project.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/app/projects/${project.id}`}
                      className="block truncate text-base font-medium text-foreground hover:text-primary"
                    >
                      {project.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(project.tags ?? []).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn("text-xs")}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="outline">
                      {projectStatusLabel(project.status)}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}
