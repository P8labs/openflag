import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { apiError, apiSuccess } from "@/lib/api";
import { buildDraftUsername, slugifyUsername } from "@/lib/username";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
  });

  return apiSuccess({ profile });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const body = (await request.json()) as {
    step?: "identity" | "details" | "project";
    username?: string;
    name?: string;
    gender?: string;
    skills?: string[];
    interests?: string[];
    availability?: string;
    bio?: string;
    personality?: string;
    lookingFor?: string;
  };

  if (body.step === "identity") {
    const username = slugifyUsername(
      body.username ?? session.user.name,
      buildDraftUsername(session.user.name, session.user.id),
    );
    const name = body.name?.trim() || session.user.name;
    const gender = body.gender?.trim() || null;
    const bio = body.bio?.trim() || null;

    if (!username || !name || !gender || !bio) {
      return apiError("Complete username, name, gender, and bio.", 400);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    const profile = await prisma.profileMeta.upsert({
      where: { userId: session.user.id },
      update: {
        username,
        avatar: session.user.image,
        gender,
        bio,
        onboardingComplete: true,
        recentActivityAt: new Date(),
      },
      create: {
        userId: session.user.id,
        username,
        avatar: session.user.image,
        bio,
        gender,
        personality: null,
        lookingFor: null,
        skills: [],
        interests: [],
        topRepositories: Prisma.DbNull,
        availability: null,
        onboardingComplete: true,
        onboardingDetailsComplete: false,
        onboardingProjectComplete: false,
        recentActivityAt: new Date(),
      },
    });

    return apiSuccess({ profile });
  }

  if (body.step === "details") {
    const skills = (body.skills ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 16);
    const interests = (body.interests ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 16);
    const availability = body.availability?.trim() ?? null;
    const personality = body.personality?.trim() ?? null;
    const lookingFor = body.lookingFor?.trim() ?? null;

    const profile = await prisma.profileMeta.upsert({
      where: { userId: session.user.id },
      update: {
        skills,
        interests,
        availability,
        personality,
        lookingFor,
        onboardingDetailsComplete: true,
        recentActivityAt: new Date(),
      },
      create: {
        userId: session.user.id,
        username: buildDraftUsername(session.user.name, session.user.id),
        avatar: session.user.image,
        bio: null,
        gender: null,
        personality,
        lookingFor,
        skills,
        interests,
        topRepositories: Prisma.DbNull,
        availability,
        onboardingComplete: false,
        onboardingDetailsComplete: true,
        onboardingProjectComplete: false,
        recentActivityAt: new Date(),
      },
    });

    return apiSuccess({ profile });
  }

  if (body.step === "project") {
    const profile = await prisma.profileMeta.upsert({
      where: { userId: session.user.id },
      update: {
        onboardingProjectComplete: true,
        recentActivityAt: new Date(),
      },
      create: {
        userId: session.user.id,
        username: buildDraftUsername(session.user.name, session.user.id),
        avatar: session.user.image,
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
        onboardingProjectComplete: true,
        recentActivityAt: new Date(),
      },
    });

    return apiSuccess({ profile });
  }

  return apiError("Invalid onboarding step.", 400);
}
