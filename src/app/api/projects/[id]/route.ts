import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

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
    isActive?: boolean;
  };

  const title = body.title?.trim();
  const description = body.description?.trim();

  const project = await prisma.project.update({
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
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      recentActivityAt: new Date(),
    },
  });

  return apiSuccess({ project });
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
