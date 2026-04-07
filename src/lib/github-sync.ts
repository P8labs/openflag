import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type GitHubProfile = {
  login: string;
  avatar_url: string;
  bio: string | null;
};

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  stargazers_count: number;
  updated_at: string;
  language: string | null;
  topics: string[];
  description: string | null;
  html_url: string;
};

const TOP_REPOSITORIES_LIMIT = 6;

function pickTopRepositories(repositories: GitHubRepository[]) {
  return [...repositories]
    .sort((a, b) => {
      const aUpdated = new Date(a.updated_at).getTime();
      const bUpdated = new Date(b.updated_at).getTime();
      const starDelta = b.stargazers_count - a.stargazers_count;

      if (starDelta !== 0) {
        return starDelta;
      }

      return bUpdated - aUpdated;
    })
    .slice(0, TOP_REPOSITORIES_LIMIT)
    .map((repository) => ({
      id: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      stars: repository.stargazers_count,
      updatedAt: repository.updated_at,
      language: repository.language,
      topics: repository.topics,
      description: repository.description,
      url: repository.html_url,
    }));
}

function deriveSkills(repositories: GitHubRepository[]) {
  const languageScore = new Map<string, number>();
  const topicScore = new Map<string, number>();

  repositories.forEach((repo) => {
    if (repo.language) {
      languageScore.set(
        repo.language,
        (languageScore.get(repo.language) ?? 0) + 2,
      );
    }

    repo.topics.forEach((topic) => {
      if (!topic || topic.length < 2) {
        return;
      }
      topicScore.set(topic, (topicScore.get(topic) ?? 0) + 1);
    });
  });

  const topLanguages = [...languageScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  const topTopics = [...topicScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  return [...new Set([...topLanguages, ...topTopics])];
}

async function fetchGithubData(accessToken: string) {
  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    throw new Error("Unable to fetch GitHub profile.");
  }

  const reposResponse = await fetch(
    "https://api.github.com/user/repos?per_page=60&sort=updated&type=owner",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (!reposResponse.ok) {
    throw new Error("Unable to fetch GitHub repositories.");
  }

  const profile = (await profileResponse.json()) as GitHubProfile;
  const repositories = (await reposResponse.json()) as GitHubRepository[];

  return { profile, repositories };
}

export async function syncGithubOnboarding({
  userId,
  useHeaderFallback,
}: {
  userId: string;
  useHeaderFallback?: Headers;
}) {
  const accessTokenResult = await auth.api.getAccessToken({
    body: {
      providerId: "github",
      userId,
    },
    headers: useHeaderFallback,
  });

  if (!accessTokenResult?.accessToken) {
    return { synced: false, reason: "missing_access_token" as const };
  }

  const { profile, repositories } = await fetchGithubData(
    accessTokenResult.accessToken,
  );
  const topRepositories = pickTopRepositories(repositories);
  const derivedSkills = deriveSkills(repositories);

  const metadata: Prisma.InputJsonValue = topRepositories;

  await prisma.profileMeta.upsert({
    where: { userId },
    update: {
      username: profile.login,
      avatar: profile.avatar_url,
      bio: profile.bio,
      skills: derivedSkills,
      topRepositories: metadata,
      onboardingComplete: true,
      recentActivityAt: new Date(),
    },
    create: {
      userId,
      username: profile.login,
      avatar: profile.avatar_url,
      bio: profile.bio,
      skills: derivedSkills,
      interests: [],
      topRepositories: metadata,
      onboardingComplete: true,
      recentActivityAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.login,
      image: profile.avatar_url,
    },
  });

  return { synced: true as const };
}
