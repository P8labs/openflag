import { Prisma } from "@/generated/prisma";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDraftUsername } from "@/lib/username";

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

function parseRepositoryFullName(fullName: string) {
  const [owner, name, ...rest] = fullName
    .trim()
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!owner || !name || rest.length > 0) {
    return null;
  }

  return { owner, name };
}

export async function starRepositoryForUser({
  userId,
  repositoryFullName,
  useHeaderFallback,
}: {
  userId: string;
  repositoryFullName: string;
  useHeaderFallback?: Headers;
}) {
  const parsedRepository = parseRepositoryFullName(repositoryFullName);

  if (!parsedRepository) {
    return { starred: false, reason: "invalid_repository" as const };
  }

  const accessTokenResult = await auth.api.getAccessToken({
    body: {
      providerId: "github",
      userId,
    },
    headers: useHeaderFallback,
  });

  if (!accessTokenResult?.accessToken) {
    return { starred: false, reason: "missing_access_token" as const };
  }

  const response = await fetch(
    `https://api.github.com/user/starred/${encodeURIComponent(parsedRepository.owner)}/${encodeURIComponent(parsedRepository.name)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessTokenResult.accessToken}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (response.status === 204) {
    return { starred: true as const };
  }

  if (response.status === 401 || response.status === 403) {
    return { starred: false, reason: "missing_scope_or_unauthorized" as const };
  }

  if (response.status === 404) {
    return { starred: false, reason: "repository_not_found" as const };
  }

  return { starred: false, reason: "github_request_failed" as const };
}

export async function seedProfileFromAuth({
  userId,
  useHeaderFallback,
  headers,
}: {
  userId: string;
  useHeaderFallback?: Headers;
  headers?: Headers;
}) {
  const accessTokenResult = await auth.api.getAccessToken({
    body: {
      providerId: "github",
      userId,
    },
    headers: useHeaderFallback ?? headers,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true },
  });

  const fallbackUsername = buildDraftUsername(user?.name ?? "builder", userId);

  if (!accessTokenResult?.accessToken) {
    await prisma.profileMeta.upsert({
      where: { userId },
      update: {
        username: fallbackUsername,
        avatar: user?.image ?? null,
        onboardingComplete: false,
        onboardingDetailsComplete: false,
        onboardingProjectComplete: false,
        recentActivityAt: new Date(),
      },
      create: {
        userId,
        username: fallbackUsername,
        avatar: user?.image ?? null,
        bio: null,
        gender: null,
        personality: null,
        lookingFor: null,
        skills: [],
        interests: [],
        topRepositories: Prisma.DbNull,
        availability: null,
        onboardingComplete: false,
        onboardingDetailsComplete: false,
        onboardingProjectComplete: false,
        recentActivityAt: new Date(),
      },
    });

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
      username: profile.login || fallbackUsername,
      avatar: profile.avatar_url,
      bio: profile.bio,
      skills: derivedSkills,
      topRepositories: metadata,
      onboardingComplete: false,
      onboardingDetailsComplete: false,
      onboardingProjectComplete: false,
      recentActivityAt: new Date(),
    },
    create: {
      userId,
      username: profile.login || fallbackUsername,
      avatar: profile.avatar_url,
      bio: profile.bio,
      gender: null,
      personality: null,
      lookingFor: null,
      skills: derivedSkills,
      interests: [],
      topRepositories: metadata,
      availability: null,
      onboardingComplete: false,
      onboardingDetailsComplete: false,
      onboardingProjectComplete: false,
      recentActivityAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.login || user?.name || fallbackUsername,
      image: profile.avatar_url || user?.image || null,
    },
  });

  return { synced: true as const };
}
