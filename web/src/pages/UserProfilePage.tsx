import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ProfileEditForm,
  type ProfileFormData,
} from "@/components/profile/ProfileEditForm";
import { useAuth } from "@/context/auth-context";
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
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    bio: "",
    skills: [],
    interests: [],
    availability: "",
    lookingFor: "",
  });

  const profileQuery = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () =>
      apiFetch<UserProfileResponse>(`/api/v1/users/${username}/profile`),
    enabled: Boolean(username),
  });

  const profile = profileQuery.data;
  const isCurrentUser = Boolean(
    profile && currentUser && currentUser.username === profile.user.username,
  );

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormData({
      username: profile.user.username,
      bio: profile.user.bio ?? "",
      skills: profile.user.skills,
      interests: profile.user.interests,
      availability: profile.user.availability ?? "",
      lookingFor: profile.user.lookingFor ?? "",
    });
  }, [profile]);

  const suggestedSkills = useMemo(
    () => [
      "Go",
      "TypeScript",
      "React",
      "Node.js",
      "Product Design",
      "AI/ML",
      "DevOps",
      "Data Engineering",
    ],
    [],
  );

  const suggestedInterests = useMemo(
    () => [
      "Open Source",
      "SaaS",
      "Developer Tools",
      "Fintech",
      "HealthTech",
      "EdTech",
      "Web3",
      "Mobile Apps",
    ],
    [],
  );

  const nextUsernameChangeDate = useMemo(() => {
    if (!currentUser?.usernameChangedAt) {
      return null;
    }
    const changedAt = new Date(currentUser.usernameChangedAt);
    if (Number.isNaN(changedAt.getTime())) {
      return null;
    }
    const next = new Date(changedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    return next;
  }, [currentUser?.usernameChangedAt]);

  const profileUpdateMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/v1/me/profile", {
        method: "PATCH",
        body: JSON.stringify(formData),
      }),
    onSuccess: async () => {
      if (!profile) {
        return;
      }

      setMessage("Profile updated.");
      setIsEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });

      if (formData.username !== profile.user.username) {
        navigate(`/${formData.username}`);
      }
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Unable to update profile.",
      );
    },
  });

  if (profileQuery.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </section>
    );
  }

  if (profileQuery.isError || !profile) {
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

          {isCurrentUser ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setIsEditing((current) => !current);
                setMessage(null);
              }}
            >
              {isEditing ? "Cancel" : "Edit profile"}
            </Button>
          ) : null}
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

      {isCurrentUser && isEditing ? (
        <ProfileEditForm
          formData={formData}
          setFormData={setFormData}
          suggestedSkills={suggestedSkills}
          suggestedInterests={suggestedInterests}
          nextUsernameChangeDate={nextUsernameChangeDate}
          isPending={profileUpdateMutation.isPending}
          message={message}
          onSubmit={() => {
            setMessage(null);
            profileUpdateMutation.mutate();
          }}
        />
      ) : null}

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
