import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectForm } from "@/components/project-form";
import { loginWithProvider, useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";

type ProjectsResponse = {
  projects: Array<{
    id: string;
    title: string;
    description: string;
    githubUrl: string | null;
    wakatimeId: string | null;
    tags: string[];
    createdAt: string;
    owner: {
      id: string;
      name: string;
      profileMeta: {
        username: string;
        avatar: string | null;
      } | null;
    };
  }>;
};

type SocialProject = ProjectsResponse["projects"][number];

const storyBuckets = [
  { label: "For you", active: true },
  { label: "Following" },
  { label: "Projects" },
  { label: "Launches" },
  { label: "Comments" },
  { label: "Saved" },
];

const feedHighlights = [
  {
    title: "Realtime product drops",
    description:
      "Share what shipped, what changed, and what people should try next.",
    toneClass: "highlight-card--cyan",
  },
  {
    title: "Community comments",
    description:
      "Keep discussions close to the project post so feedback stays contextual.",
    toneClass: "highlight-card--emerald",
  },
  {
    title: "Profile-linked work",
    description:
      "Your feed surfaces projects, posts, and linked repos in a single stream.",
    toneClass: "highlight-card--amber",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function LandingPage() {
  return (
    <section className="landing-grid">
      <Card className="landing-hero">
        <CardHeader>
          <Badge variant="soft">Openflag social</Badge>
          <CardTitle>
            Share what you build in a feed that feels alive.
          </CardTitle>
          <CardDescription>
            A polished social-media UI for projects, posts, comments, profiles,
            notifications, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="landing-actions">
          <Button onClick={() => loginWithProvider("github")}>
            Continue with GitHub
          </Button>
          <Button variant="outline" onClick={() => loginWithProvider("google")}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

export function CallbackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <Card className="callback-card">
      <CardHeader>
        <Badge variant="soft">OAuth callback</Badge>
        <CardTitle>{isLoading ? "Confirming session" : "Signed out"}</CardTitle>
        <CardDescription>
          {isLoading
            ? "Fetching the session from the Go API."
            : "The callback finished, but no session was found."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function AppHomePage() {
  const { user } = useAuth();
  const projectsQuery = useQuery<ProjectsResponse>({
    queryKey: ["projects"],
    queryFn: () => apiFetch<ProjectsResponse>("/api/v1/projects"),
  });

  const projects = projectsQuery.data?.projects ?? [];

  return (
    <div className="feed-layout">
      <section className="feed-main stack-gap-lg">
        <Card className="story-strip-card">
          <CardHeader className="story-strip-header">
            <div>
              <CardTitle>Stories</CardTitle>
              <CardDescription>
                Active contributors and current momentum.
              </CardDescription>
            </div>
            <Badge variant="outline">{projects.length} live posts</Badge>
          </CardHeader>
          <CardContent className="story-strip">
            {storyBuckets.map((story) => (
              <button
                className={`story-pill${story.active ? " story-pill--active" : ""}`}
                key={story.label}
                type="button"
              >
                <span className="story-pill__dot" />
                {story.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <ProjectForm />

        <div className="stack-gap-sm">
          {feedHighlights.map((highlight) => (
            <Card
              className={`highlight-card ${highlight.toneClass}`}
              key={highlight.title}
            >
              <CardHeader>
                <Badge variant="soft">Feature preview</Badge>
                <CardTitle>{highlight.title}</CardTitle>
                <CardDescription>{highlight.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="feed-panel">
          <CardHeader className="feed-panel__header">
            <div>
              <Badge variant="outline">Feed</Badge>
              <CardTitle>Latest posts and projects</CardTitle>
              <CardDescription>
                Mixed content stream with linked work and discussion.
              </CardDescription>
            </div>
            <div className="topbar-actions">
              <Button variant="outline" size="sm">
                Latest
              </Button>
              <Button variant="outline" size="sm">
                Popular
              </Button>
            </div>
          </CardHeader>
          <CardContent className="feed-list">
            {projectsQuery.isLoading ? (
              <p className="helper-text">Loading projects...</p>
            ) : null}

            {!projectsQuery.isLoading && projects.length === 0 ? (
              <div className="empty-feed">
                <p className="empty-feed__title">No posts yet</p>
                <p className="empty-feed__copy">
                  Create the first project update to populate the center feed.
                </p>
              </div>
            ) : null}

            {projects.map((project, index) => (
              <FeedCard index={index} key={project.id} project={project} />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="feed-meta panel">
        <p className="eyebrow">Session</p>
        <h2>{user?.name}</h2>
        <p>{user?.email}</p>
      </section>
    </div>
  );
}

function FeedCard({
  project,
  index,
}: {
  project: SocialProject;
  index: number;
}) {
  const profile = project.owner.profileMeta;
  const displayName = profile?.username ?? project.owner.name;

  return (
    <Card className="post-card">
      <CardHeader className="post-card__header">
        <div className="post-card__author">
          <Avatar className="size-11">
            {profile?.avatar ? (
              <AvatarImage alt={displayName} src={profile.avatar} />
            ) : null}
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{project.title}</CardTitle>
            <CardDescription>
              @{displayName} ·{" "}
              {new Date(project.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
        <Badge variant="soft">#{index + 1}</Badge>
      </CardHeader>

      <CardContent className="post-card__content">
        <p className="post-body">{project.description}</p>

        <div className="meta-grid">
          <div className="meta-chip">
            <span className="meta-label">GitHub</span>
            <span className="meta-value">
              {project.githubUrl ? "Connected" : "Not linked"}
            </span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">WakaTime</span>
            <span className="meta-value">
              {project.wakatimeId ? "Synced" : "Optional"}
            </span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Comments</span>
            <span className="meta-value">Open</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Status</span>
            <span className="meta-value">Featured</span>
          </div>
        </div>

        {project.tags.length ? (
          <div className="tag-row">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="post-card__footer">
        <div className="action-row">
          <Button variant="ghost" size="sm">
            Like
          </Button>
          <Button variant="ghost" size="sm">
            Comment
          </Button>
          <Button variant="ghost" size="sm">
            Share
          </Button>
        </div>
        <Button variant="outline" size="sm">
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
