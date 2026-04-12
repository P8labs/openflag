import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { projectStatusLabel } from "@/lib/project-status";
import { cn } from "@/lib/utils";

type ExploreProject = {
  id: string;
  title: string;
  summary: string;
  status?: string;
  tags?: string[];
  owner?: ExploreUser;
  updatedAt: string;
};

type ExploreUser = {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  interests?: string[];
  skills?: string[];
};

type ExploreResponse = {
  query: string;
  filter: string;
  projects: ExploreProject[];
  users: ExploreUser[];
  hasMore: boolean;
  nextOffset: number;
};

type ExploreMode =
  | "all"
  | "projects"
  | "users"
  | "trending"
  | "recent"
  | "skill-match"
  | "interest-match";

type ExploreItem =
  | { type: "project"; id: string; project: ExploreProject }
  | { type: "user"; id: string; user: ExploreUser };

function userInitials(user: ExploreUser) {
  return user.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ExplorePage() {
  const PAGE_SIZE = 12;
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ExploreMode>("trending");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0);
  }, [query, mode]);

  const exploreQuery = useQuery({
    queryKey: ["explore", query, mode, offset],
    queryFn: () => {
      const params = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed) {
        params.set("q", trimmed);
      }
      params.set("filter", mode);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));

      return apiFetch<ExploreResponse>(`/api/v1/explore?${params.toString()}`);
    },
    staleTime: 30_000,
  });

  const projects = exploreQuery.data?.projects ?? [];
  const users = exploreQuery.data?.users ?? [];
  const hasMore = exploreQuery.data?.hasMore ?? false;
  const nextOffset = exploreQuery.data?.nextOffset ?? offset + PAGE_SIZE;
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  const listItems = useMemo<ExploreItem[]>(() => {
    const projectItems: ExploreItem[] = projects.map((project) => ({
      type: "project",
      id: `project-${project.id}`,
      project,
    }));

    const userItems: ExploreItem[] = users.map((user) => ({
      type: "user",
      id: `user-${user.id}`,
      user,
    }));

    return [...projectItems, ...userItems].sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "project" ? -1 : 1;
      }

      if (left.type === "project" && right.type === "project") {
        return (
          new Date(right.project.updatedAt).getTime() -
          new Date(left.project.updatedAt).getTime()
        );
      }

      if (left.type === "user" && right.type === "user") {
        return left.user.name.localeCompare(right.user.name);
      }

      return 0;
    });
  }, [projects, users]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case "recent":
        return "recent";
      case "skill-match":
        return "skill match";
      case "interest-match":
        return "interest match";
      default:
        return "trending";
    }
  }, [mode]);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
      <header className="space-y-2 border-b border-border pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold leading-tight">
          <Compass className="size-5" />
          Explore
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover people and projects in one unified search lane.
        </p>
      </header>

      <section className="space-y-3 border-b border-border pb-5 w-full">
        <div className="flex w-full max-w-3xl items-stretch">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, users, skills, interests"
              className="h-12 w-full rounded-r-none border-r-0 pl-9"
            />
          </label>

          <Select
            value={mode}
            onValueChange={(value: ExploreMode) => setMode(value)}
          >
            <SelectTrigger className="h-12 rounded-l-none border-l-0 py-0 data-[size=default]:h-12">
              <SelectValue placeholder="Explore mode" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="skill-match">Skill Match</SelectItem>
              <SelectItem value="interest-match">Interest Match</SelectItem>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="projects">Projects Only</SelectItem>
              <SelectItem value="users">Users Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium">Results</h2>
          <p className="text-sm text-muted-foreground">
            {listItems.length} match{listItems.length === 1 ? "" : "es"}.
            {!query.trim() ? ` Showing ${modeLabel} results.` : null}
          </p>
        </div>

        {exploreQuery.isLoading ? (
          <div className="border border-border bg-background/50 px-4 py-8 text-sm text-muted-foreground">
            Loading explore data...
          </div>
        ) : null}

        {exploreQuery.isError ? (
          <div className="border border-destructive/40 bg-background/50 px-4 py-8 text-sm text-destructive">
            {exploreQuery.error instanceof Error
              ? exploreQuery.error.message
              : "Unable to load explore data."}
          </div>
        ) : null}

        {!exploreQuery.isLoading &&
        !exploreQuery.isError &&
        listItems.length === 0 ? (
          <div className="border border-border bg-background/50 px-4 py-8 text-sm text-muted-foreground">
            No items match these filters.
          </div>
        ) : null}

        {!exploreQuery.isLoading &&
        !exploreQuery.isError &&
        listItems.length > 0 ? (
          <ul className="overflow-hidden rounded-lg border border-border bg-background/35">
            {listItems.map((item, index) => {
              if (item.type === "project") {
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "px-4 py-4",
                      index > 0 && "border-t border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/app/projects/${item.project.id}`}
                            className="truncate text-sm font-medium hover:text-primary"
                          >
                            {item.project.title}
                          </Link>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {item.project.summary}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {(item.project.tags ?? []).slice(0, 5).map((tag) => (
                            <Badge
                              key={`${item.project.id}-${tag}`}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <div>{projectStatusLabel(item.project.status)}</div>
                        <div className="mt-1">
                          {new Date(
                            item.project.updatedAt,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={item.id}
                  className={cn(
                    "px-4 py-4",
                    index > 0 && "border-t border-border",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 border border-border">
                      {item.user.image ? (
                        <AvatarImage
                          src={item.user.image}
                          alt={item.user.username}
                        />
                      ) : (
                        <AvatarFallback>
                          {userInitials(item.user) || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/${item.user.username}`}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {item.user.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          @{item.user.username}
                        </span>
                      </div>

                      {item.user.bio ? (
                        <p className="text-sm text-muted-foreground">
                          {item.user.bio}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {(item.user.interests ?? [])
                          .slice(0, 4)
                          .map((interest) => (
                            <Badge
                              key={`${item.user.id}-${interest}`}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {interest}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!exploreQuery.isLoading && !exploreQuery.isError ? (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Page {page}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() =>
                  setOffset((current) => Math.max(current - PAGE_SIZE, 0))
                }
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setOffset(nextOffset)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}
