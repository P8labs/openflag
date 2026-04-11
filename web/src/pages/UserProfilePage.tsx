import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

type UserProfileResponse = {
  user: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
    bio?: string | null;
    skills: string[];
    interests: string[];
    availability?: string | null;
    lookingFor?: string | null;
  };
  currentStreak: number;
  longestStreak: number;
  totalTrackedMinutes: number;
  recentProjects: Array<{
    id: string;
    title: string;
    summary: string;
    status: string;
    logoUrl: string;
    createdAt: string;
  }>;
  recentPosts: Array<{
    id: string;
    content: string;
    category: string;
    createdAt: string;
    devlogMinutes?: number;
    projectId?: string;
    projectTitle?: string;
    refUrls: string[];
  }>;
  activityDays: Array<{ date: string; count: number }>;
};

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();

  const profileQuery = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () =>
      apiFetch<UserProfileResponse>(`/api/v1/users/${username}/profile`),
    enabled: Boolean(username),
  });

  if (profileQuery.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </section>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
        <p className="text-sm text-destructive">
          {profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Unable to load profile."}
        </p>
      </section>
    );
  }

  const profile = profileQuery.data;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-14 border border-border">
            {profile.user.image ? (
              <AvatarImage
                src={profile.user.image}
                alt={profile.user.username}
              />
            ) : (
              <AvatarFallback>
                {(profile.user.name || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div>
            <h1 className="text-2xl font-semibold">{profile.user.name}</h1>
            <p className="text-sm text-muted-foreground">
              @{profile.user.username}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {profile.user.bio || "No bio provided yet."}
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="soft">Current streak {profile.currentStreak}d</Badge>
          <Badge variant="outline">Longest {profile.longestStreak}d</Badge>
          <Badge variant="outline">
            Total tracked {formatDuration(profile.totalTrackedMinutes)}
          </Badge>
        </div>
      </header>

      <section className="space-y-3 border-b border-border pb-5">
        <h2 className="text-base font-medium">Streak Heatmap</h2>
        <div className="grid grid-cols-12 gap-1">
          {profile.activityDays.map((day) => (
            <span
              key={day.date}
              title={`${day.date} • ${day.count} posts`}
              className={
                day.count >= 4
                  ? "h-3 w-3 rounded-sm bg-emerald-600"
                  : day.count === 3
                    ? "h-3 w-3 rounded-sm bg-emerald-500"
                    : day.count === 2
                      ? "h-3 w-3 rounded-sm bg-emerald-400"
                      : day.count === 1
                        ? "h-3 w-3 rounded-sm bg-emerald-300"
                        : "h-3 w-3 rounded-sm bg-muted"
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-5">
        <h2 className="text-base font-medium">Profile Signals</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Looking for: {profile.user.lookingFor || "Not specified"}</p>
          <p>Availability: {profile.user.availability || "Not specified"}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.user.skills.map((item) => (
            <Badge key={`skill-${item}`} variant="outline">
              {item}
            </Badge>
          ))}
          {profile.user.interests.map((item) => (
            <Badge key={`interest-${item}`} variant="soft">
              {item}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-5">
        <h2 className="text-base font-medium">Recent Projects</h2>
        <ul className="divide-y divide-border rounded-md border border-border">
          {profile.recentProjects.map((project) => (
            <li key={project.id} className="px-4 py-3">
              <Link
                to={`/app/projects/${project.id}`}
                className="font-medium hover:text-primary"
              >
                {project.title}
              </Link>
              <p className="text-sm text-muted-foreground">{project.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">Recent Posts</h2>
        <ul className="divide-y divide-border rounded-md border border-border">
          {profile.recentPosts.map((post) => (
            <li key={post.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="soft">{post.category}</Badge>
                <span className="text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{post.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
