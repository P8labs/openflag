import { redirect } from "next/navigation";

import { DevlogFeed } from "@/components/feed/devlog-feed";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function FeedPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.onboardingComplete) {
    redirect("/onboarding");
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    include: {
      owner: {
        select: {
          name: true,
          profileMeta: {
            select: { username: true, avatar: true },
          },
        },
      },
    },
    orderBy: { recentActivityAt: "desc" },
    take: 40,
  });

  return (
    <DevlogFeed
      currentUser={{
        name: session.user.name,
        username: profile.username,
        avatar: profile.avatar,
      }}
      initialItems={projects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        tags: project.tags,
        recentActivityAt: project.recentActivityAt.toISOString(),
        owner: {
          name: project.owner.name,
          username: project.owner.profileMeta?.username ?? "unknown",
          avatar: project.owner.profileMeta?.avatar ?? null,
        },
      }))}
    />
  );
}
