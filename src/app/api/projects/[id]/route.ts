import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { fetchWakatimeProjects, getWakatimeAccessToken } from "@/lib/wakatime";

function normalizeList(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 16);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });

  if (!existing) {
    return apiError("Project not found", 404);
  }

  if (existing.ownerId !== session.user.id) {
    return apiError("Forbidden", 403);
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    requiredRoles?: string[];
    tags?: string[];
    image?: string | null;
    video?: string | null;
    githubRepoUrl?: string | null;
    githubPrUrl?: string | null;
    wakatimeProjectIds?: string[];
    isActive?: boolean;
  };

  const title = body.title?.trim();
  const description = body.description?.trim();
  const githubRepoUrl =
    body.githubRepoUrl === undefined ? undefined : body.githubRepoUrl?.trim() || null;
  const githubPrUrl =
    body.githubPrUrl === undefined ? undefined : body.githubPrUrl?.trim() || null;
  const wakatimeProjectIds =
    body.wakatimeProjectIds === undefined
      ? undefined
      : normalizeList(body.wakatimeProjectIds);

  let selectedWakaProjects: Awaited<
    ReturnType<typeof fetchWakatimeProjects>
  > | null = null;

  if (wakatimeProjectIds) {
    if (wakatimeProjectIds.length === 0) {
      selectedWakaProjects = [];
    } else {
      const accessToken = await getWakatimeAccessToken(session.user.id);
      if (!accessToken) {
        return apiError("Connect WakaTime before linking projects.", 400);
      }

      const allWakaProjects = await fetchWakatimeProjects({ accessToken });
      selectedWakaProjects = allWakaProjects.filter((project) =>
        wakatimeProjectIds.includes(project.id),
      );

      if (selectedWakaProjects.length !== wakatimeProjectIds.length) {
        return apiError("Some linked WakaTime projects are invalid.", 400);
      }
    }
  }

  await prisma.project.update({
    where: { id },
    data: {
      title: title && title.length > 0 ? title : undefined,
      description:
        description && description.length > 0 ? description : undefined,
      requiredRoles: body.requiredRoles
        ? normalizeList(body.requiredRoles)
        : undefined,
      tags: body.tags ? normalizeList(body.tags) : undefined,
      image: body.image === undefined ? undefined : body.image?.trim() || null,
      video: body.video === undefined ? undefined : body.video?.trim() || null,
      githubRepoUrl,
      githubPrUrl,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      recentActivityAt: new Date(),
    },
  });

  if (selectedWakaProjects) {
    await prisma.projectWakatimeLink.deleteMany({
      where: { projectId: id },
    });

    if (selectedWakaProjects.length) {
      await prisma.projectWakatimeLink.createMany({
        data: selectedWakaProjects.map((projectLink) => ({
          projectId: id,
          wakatimeProjectId: projectLink.id,
          wakatimeProjectName: projectLink.name,
          timeLoggedSeconds: projectLink.timeLoggedSeconds,
          timeWorkedSeconds: projectLink.timeWorkedSeconds,
        })),
        skipDuplicates: true,
      });
    }
  }

  const fullProject = await prisma.project.findUnique({
    where: { id },
    include: {
      wakatimeLinks: true,
    },
  });

  return apiSuccess({ project: fullProject });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });

  if (!existing) {
    return apiError("Project not found", 404);
  }

  if (existing.ownerId !== session.user.id) {
    return apiError("Forbidden", 403);
  }

  await prisma.project.delete({ where: { id } });

  return apiSuccess({ success: true });
}
