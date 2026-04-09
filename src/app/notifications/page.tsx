import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function NotificationsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const [latestMatches, ownProjects] = await Promise.all([
    prisma.match.findMany({
      where: {
        OR: [
          { userAId: session.user.id },
          { userBId: session.user.id },
          { interestedUserId: session.user.id },
          { projectOwnerId: session.user.id },
        ],
      },
      include: {
        project: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.project.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const items = [
    ...latestMatches.map((match) => ({
      id: `match-${match.id}`,
      text:
        match.type === "USER_USER"
          ? "You have a new people match."
          : `Someone is interested in ${match.project?.title ?? "your project"}.`,
    })),
    ...ownProjects.map((project) => ({
      id: `project-${project.id}`,
      text: `${project.title} was updated recently.`,
    })),
  ].slice(0, 20);

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  });

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <header className="ui-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Notifications
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Updates</h1>
        <p className="mt-2 text-sm text-muted">
          @{profile?.username ?? session.user.name}
        </p>
      </header>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="ui-panel-muted px-4 py-3 text-sm text-foreground/80"
          >
            {item.text}
          </article>
        ))}
        {!items.length ? (
          <p className="ui-panel-muted px-4 py-3 text-sm text-muted">
            No notifications yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
