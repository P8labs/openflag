import { NextResponse } from "next/server";

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

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    },
    orderBy: { recentActivityAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    requiredRoles?: string[];
    tags?: string[];
    image?: string | null;
    video?: string | null;
  };

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const requiredRoles = normalizeList(body.requiredRoles);
  const tags = normalizeList(body.tags);
  const image = body.image?.trim() || null;
  const video = body.video?.trim() || null;

  if (!title || !description) {
    return NextResponse.json(
      { error: "title and description are required." },
      { status: 400 },
    );
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
      isActive: true,
      recentActivityAt: new Date(),
    },
  });

  await prisma.profileMeta.updateMany({
    where: { userId: session.user.id },
    data: { recentActivityAt: new Date() },
  });

  return NextResponse.json({ project }, { status: 201 });
}
