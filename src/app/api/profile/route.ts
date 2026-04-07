import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    skills?: string[];
    interests?: string[];
    availability?: string;
    bio?: string;
  };

  const skills = (body.skills ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
  const interests = (body.interests ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
  const availability = body.availability?.trim() ?? null;
  const bio = body.bio?.trim() ?? null;

  const onboardingComplete =
    skills.length > 0 && interests.length > 0 && Boolean(availability);

  const profile = await prisma.profileMeta.upsert({
    where: { userId: session.user.id },
    update: {
      skills,
      interests,
      availability,
      bio,
      onboardingComplete,
      recentActivityAt: new Date(),
    },
    create: {
      userId: session.user.id,
      username: session.user.name.toLowerCase().replace(/\s+/g, "-"),
      avatar: session.user.image,
      bio,
      skills,
      interests,
      availability,
      onboardingComplete,
      recentActivityAt: new Date(),
    },
  });

  return NextResponse.json({ profile });
}
