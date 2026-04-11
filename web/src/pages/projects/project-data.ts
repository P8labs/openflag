export type ProjectStage = "idea" | "building" | "launched";

export type ProjectCollaborator = {
  id: string;
  name: string;
  username: string;
};

export type ProjectPost = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  devlogMinutes?: number;
  githubUrl?: string;
  refUrls?: string[];
};

export type ProjectItem = {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  description: string;
  url?: string;
  image?: string;
  video?: string;
  githubUrl?: string;
  githubStars?: number;
  wakatimeTrackedMinutes?: number;
  wakatimeIds: string[];
  stage: ProjectStage;
  tags: string[];
  collaborators: ProjectCollaborator[];
  linkedPosts: ProjectPost[];
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    username: string;
  };
};

export const projectList: ProjectItem[] = [
  {
    id: "p-1",
    ownerId: "u-1",
    title: "OpenFlag Contributor Graph",
    summary: "Visualize contributor momentum and session activity by project.",
    description:
      "This project maps contributor velocity across sessions and surfaces consistency trends. It powers internal insights in the feed and helps prioritize active collaborators.",
    url: "https://openflag.dev/contributor-graph",
    image:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    githubUrl: "https://github.com/openflaghq/contributor-graph",
    githubStars: 428,
    wakatimeTrackedMinutes: 180,
    wakatimeIds: ["openflag-contributor-graph"],
    stage: "building",
    tags: ["analytics", "go", "react"],
    collaborators: [
      { id: "u-2", name: "Rhea", username: "rhea-dev" },
      { id: "u-3", name: "Kabir", username: "kabirgo" },
    ],
    linkedPosts: [
      {
        id: "post-1",
        content:
          "Shipped contributor streak graph and added weekly trend overlays.",
        createdAt: "2026-04-10T15:20:00.000Z",
        authorName: "Priyanshu",
        devlogMinutes: 120,
        refUrls: ["pr:https://github.com/openflaghq/contributor-graph/pull/42"],
      },
      {
        id: "post-2",
        content:
          "Connected activity scoring to DB sessions for reliable daily snapshots.",
        createdAt: "2026-04-09T10:45:00.000Z",
        authorName: "Rhea",
        refUrls: [
          "issue:https://github.com/openflaghq/contributor-graph/issues/31",
        ],
      },
    ],
    createdAt: "2026-03-28T08:20:00.000Z",
    updatedAt: "2026-04-10T17:40:00.000Z",
    owner: { id: "u-1", name: "Priyanshu", username: "priyanshu" },
  },
  {
    id: "p-2",
    ownerId: "u-4",
    title: "Galaxy Discovery Feed",
    summary:
      "Rank projects by shipping consistency and recent engagement signals.",
    description:
      "A discovery layer that combines freshness, engagement, and update quality to rank promising projects. The goal is better signal and less noisy feed clutter.",
    githubUrl: "https://github.com/openflaghq/galaxy-discovery",
    githubStars: 91,
    wakatimeIds: [],
    stage: "idea",
    tags: ["ranking", "product"],
    collaborators: [{ id: "u-5", name: "Ari", username: "ariux" }],
    linkedPosts: [
      {
        id: "post-3",
        content:
          "Drafted feed ranking formula with quality and recency weights.",
        createdAt: "2026-04-08T09:10:00.000Z",
        authorName: "Team OpenFlag",
      },
    ],
    createdAt: "2026-04-07T12:00:00.000Z",
    updatedAt: "2026-04-08T09:15:00.000Z",
    owner: { id: "u-4", name: "Team OpenFlag", username: "openflag" },
  },
  {
    id: "p-3",
    ownerId: "u-6",
    title: "Session Guard Middleware",
    summary:
      "Harden auth session checks and centralize token revocation behavior.",
    description:
      "Consolidated middleware for validating DB-backed sessions with better revoke handling. This reduced auth drift and made logout behavior reliable across clients.",
    githubUrl: "https://github.com/openflaghq/api",
    githubStars: 312,
    wakatimeTrackedMinutes: 340,
    wakatimeIds: ["openflag-api-core", "openflag-auth-module"],
    stage: "launched",
    tags: ["backend", "security", "go"],
    collaborators: [
      { id: "u-7", name: "Nisha", username: "nsh" },
      { id: "u-8", name: "Roman", username: "romango" },
    ],
    linkedPosts: [
      {
        id: "post-4",
        content:
          "JWT fully replaced with DB sessions and revoke-on-logout flow.",
        createdAt: "2026-04-05T11:10:00.000Z",
        authorName: "Backend Core",
        devlogMinutes: 300,
        githubUrl: "https://github.com/openflaghq/api/commit/abc123",
      },
    ],
    createdAt: "2026-03-16T09:00:00.000Z",
    updatedAt: "2026-04-05T11:20:00.000Z",
    owner: { id: "u-6", name: "Backend Core", username: "backend-core" },
  },
];

export function stageBadge(stage: ProjectStage) {
  switch (stage) {
    case "idea":
      return "secondary" as const;
    case "building":
      return "soft" as const;
    case "launched":
      return "default" as const;
  }
}

export function stageLabel(stage: ProjectStage) {
  switch (stage) {
    case "idea":
      return "Idea";
    case "building":
      return "Building";
    case "launched":
      return "Launched";
  }
}
