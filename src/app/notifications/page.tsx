import { redirect } from "next/navigation";

import { BellIcon } from "@/components/app-icons";
import { MobileNav } from "@/components/mobile-nav";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function NotificationsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
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

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <section className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <BellIcon className="size-4" />
          <p className="uppercase tracking-[0.2em]">Notifications</p>
        </div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Updates</h1>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[20px] border border-white/10 bg-[#151b25] px-4 py-3 text-sm text-white/80"
            >
              {item.text}
            </article>
          ))}
          {!items.length ? (
            <p className="rounded-[20px] border border-white/10 bg-[#151b25] px-4 py-3 text-sm text-white/70">
              No notifications yet.
            </p>
          ) : null}
        </div>

        <MobileNav />
      </section>
    </main>
  );
}
