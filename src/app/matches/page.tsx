import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function MatchesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
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
      userA: { select: { name: true } },
      userB: { select: { name: true } },
      interestedUser: { select: { name: true } },
      project: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  });

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <header className="ui-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Matches</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Your Circle
        </h1>
        <p className="mt-2 text-sm text-muted">
          @{profile?.username ?? session.user.name}
        </p>
      </header>

      <div className="space-y-3">
        {matches.map((match) => (
          <article key={match.id} className="ui-panel-muted px-4 py-3">
            <p className="text-sm text-foreground/80">
              {match.type === "USER_USER"
                ? `${match.userA?.name ?? "Unknown"} and ${match.userB?.name ?? "Unknown"} matched`
                : `${match.interestedUser?.name ?? "Someone"} is interested in ${match.project?.title ?? "a project"}`}
            </p>
          </article>
        ))}
        {!matches.length ? (
          <p className="ui-panel-muted px-4 py-3 text-sm text-muted">
            No matches yet. Keep swiping on Feed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
