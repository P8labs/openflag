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

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          profileMeta: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      },
      wakatimeLinks: true,
    },
    orderBy: { recentActivityAt: "desc" },
    take: 200,
  });

  return apiSuccess({ projects });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
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
  };

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const requiredRoles = normalizeList(body.requiredRoles);
  const tags = normalizeList(body.tags);
  const image = body.image?.trim() || null;
  const video = body.video?.trim() || null;
  const githubRepoUrl = body.githubRepoUrl?.trim() || null;
  const githubPrUrl = body.githubPrUrl?.trim() || null;
  const wakatimeProjectIds = normalizeList(body.wakatimeProjectIds);

  if (!title || !description) {
    return apiError("title and description are required.", 400);
  }

  let selectedWakaProjects: Awaited<
    ReturnType<typeof fetchWakatimeProjects>
  > = [];

  if (wakatimeProjectIds.length) {
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

  const project = await prisma.project.create({
    data: {
      ownerId: session.user.id,
      title,
      description,
      requiredRoles,
      tags,
      image,
      video,
      githubRepoUrl,
      githubPrUrl,
      isActive: true,
      recentActivityAt: new Date(),
    },
  });

  if (selectedWakaProjects.length) {
    await prisma.projectWakatimeLink.createMany({
      data: selectedWakaProjects.map((projectLink) => ({
        projectId: project.id,
        wakatimeProjectId: projectLink.id,
        wakatimeProjectName: projectLink.name,
        timeLoggedSeconds: projectLink.timeLoggedSeconds,
        timeWorkedSeconds: projectLink.timeWorkedSeconds,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.profileMeta.updateMany({
    where: { userId: session.user.id },
    data: { recentActivityAt: new Date() },
  });

  const completeProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      wakatimeLinks: true,
    },
  });

  return apiSuccess({ project: completeProject }, { status: 201 });
}
