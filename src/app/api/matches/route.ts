import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { userAId: session.user.id },
        { userBId: session.user.id },
        { interestedUserId: session.user.id },
        { projectOwnerId: session.user.id },
      ],
      status: "ACTIVE",
    },
    include: {
      userA: { select: { id: true, name: true, image: true } },
      userB: { select: { id: true, name: true, image: true } },
      interestedUser: { select: { id: true, name: true, image: true } },
      project: { select: { id: true, title: true, description: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return apiSuccess({ matches });
}
