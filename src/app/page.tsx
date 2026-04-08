import { ProfileSetupForm } from "@/components/profile-setup-form";
import { SignInCard } from "@/components/sign-in-card";
import { SwipeFeed } from "@/components/swipe-feed";
import { getFeedPage } from "@/lib/feed";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { Link, Chip } from "@heroui/react";

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect("/feed");
  }

  if (!session) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
          <section className="w-full rounded-[32px] border border-black/5 bg-white/75 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <Chip size="sm" variant="secondary">
                Public discovery
              </Chip>
              <Chip size="sm" variant="soft">
                Private by default
              </Chip>
            </div>

            <div className="mt-6 max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Openflag
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Find collaborators, evaluate projects, and star the ones worth
                shipping.
              </h1>
              <p className="max-w-xl text-sm text-muted sm:text-base">
                GitHub sync pulls in your profile automatically, the feed ranks
                people and projects by relevance, and a right swipe can star a
                repository for you when the project exposes a GitHub link.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Link
                className="no-underline inline-flex h-10 items-center justify-center rounded-xs border border-black/10 px-4 text-sm font-medium text-foreground transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                href="/roadmap"
              >
                View roadmap
              </Link>
              <div className="inline-flex h-10 items-center rounded-xs border border-black/5 bg-black/5 px-4 text-sm text-muted dark:border-white/10 dark:bg-white/5">
                Protected areas unlock after GitHub sign-in.
              </div>
            </div>
          </section>

          <div className="flex w-full justify-center">
            <SignInCard />
          </div>
        </div>
      </main>
    );
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.onboardingComplete) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[32px] border border-black/5 bg-white/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-8 lg:p-10">
            <Chip size="sm" variant="secondary">
              Onboarding
            </Chip>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Finish your profile once, then let the feed do the sorting.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted sm:text-base">
              GitHub data is already in place. Add the extra context that makes
              matches useful: what you can build, what you want to build, and
              how much time you have.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-muted">
              <p>Skills and interests drive the ranking.</p>
              <p>Availability helps surface practical collaborations.</p>
              <p>Right swipes can star GitHub repos for later review.</p>
            </div>
          </section>

          <ProfileSetupForm
            initialAvailability={profile?.availability ?? ""}
            initialBio={profile?.bio ?? ""}
            initialInterests={profile?.interests ?? []}
            initialSkills={profile?.skills ?? []}
          />
        </div>
      </main>
    );
  }

  const initialFeed = await getFeedPage({
    userId: session.user.id,
    limit: 12,
  });

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl justify-center">
        <SwipeFeed initialData={initialFeed} />
      </div>
    </main>
  );
}
