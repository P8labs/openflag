import { redirect } from "next/navigation";

import { HeartIcon } from "@/components/app-icons";
import { MobileNav } from "@/components/mobile-nav";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function MatchesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
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

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <section className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <HeartIcon className="size-4" />
          <p className="uppercase tracking-[0.2em]">Matches</p>
        </div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          Your Circle
        </h1>

        <div className="mt-4 space-y-3">
          {matches.map((match) => (
            <article
              key={match.id}
              className="rounded-[20px] border border-white/10 bg-[#151b25] px-4 py-3"
            >
              <p className="text-sm text-white/80">
                {match.type === "USER_USER"
                  ? `${match.userA?.name ?? "Unknown"} and ${match.userB?.name ?? "Unknown"} matched`
                  : `${match.interestedUser?.name ?? "Someone"} is interested in ${match.project?.title ?? "a project"}`}
              </p>
            </article>
          ))}
          {!matches.length ? (
            <p className="rounded-[20px] border border-white/10 bg-[#151b25] px-4 py-3 text-sm text-white/70">
              No matches yet. Keep swiping on Feed.
            </p>
          ) : null}
        </div>

        <MobileNav />
      </section>
    </main>
  );
}
