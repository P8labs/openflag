import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type CreatePostBody = {
  content?: string;
  projectIds?: string[];
  githubRepoUrl?: string | null;
  githubPrUrl?: string | null;
  wakatimeProjectId?: string | null;
  wakatimeProjectName?: string | null;
};

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeProjectIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((id) => String(id).trim())
    .filter(Boolean)
    .slice(0, 6);

  return [...new Set(ids)];
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const body = (await request.json()) as CreatePostBody;
  const content = body.content?.trim() ?? "";
  const projectIds = normalizeProjectIds(body.projectIds);
  const githubRepoUrl = normalizeOptionalText(body.githubRepoUrl);
  const githubPrUrl = normalizeOptionalText(body.githubPrUrl);
  const wakatimeProjectId = normalizeOptionalText(body.wakatimeProjectId);
  const wakatimeProjectName = normalizeOptionalText(body.wakatimeProjectName);

  if (!content) {
    return apiError("Post content is required.", 400);
  }

  if (content.length > 5000) {
    return apiError("Post content is too long.", 400);
  }

  if (projectIds.length) {
    const ownedProjects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        ownerId: session.user.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (ownedProjects.length !== projectIds.length) {
      return apiError("Some linked projects are invalid.", 400);
    }
  }

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      content,
      githubRepoUrl,
      githubPrUrl,
      wakatimeProjectId,
      wakatimeProjectName,
      recentActivityAt: new Date(),
      projects: projectIds.length
        ? {
            createMany: {
              data: projectIds.map((projectId) => ({ projectId })),
            },
          }
        : undefined,
    },
    include: {
      projects: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
              image: true,
              video: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  await prisma.profileMeta.updateMany({
    where: { userId: session.user.id },
    data: { recentActivityAt: new Date() },
  });

  return apiSuccess({ post }, { status: 201 });
}
