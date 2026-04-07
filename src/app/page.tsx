import { headers } from "next/headers";

import { ProfileSetupForm } from "@/components/profile-setup-form";
import { ManifestoPage } from "@/components/manifesto-page";
import { SignInCard } from "@/components/sign-in-card";
import { SwipeFeed } from "@/components/swipe-feed";
import { getFeedPage } from "@/lib/feed";
import { syncGithubOnboarding } from "@/lib/github-sync";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { isManifestoMode } from "@/lib/site-mode";

export default async function Home() {
  if (isManifestoMode) {
    return <ManifestoPage />;
  }

  const session = await getServerSession();

  if (!session) {
    return <SignInCard />;
  }

  await syncGithubOnboarding({
    userId: session.user.id,
    useHeaderFallback: await headers(),
  });

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.onboardingComplete) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <ProfileSetupForm
          initialAvailability={profile?.availability ?? ""}
          initialBio={profile?.bio ?? ""}
          initialInterests={profile?.interests ?? []}
          initialSkills={profile?.skills ?? []}
        />
      </main>
    );
  }

  const initialFeed = await getFeedPage({
    userId: session.user.id,
    limit: 12,
  });

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-xs border border-black/5 bg-white/70 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="space-y-0.5">
            <p className="text-sm font-medium tracking-tight">Openflag</p>
            <p className="text-xs text-muted">Fast discovery for builders.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xs border border-black/5 bg-black/5 px-2 py-1 text-xs text-muted dark:border-white/10 dark:bg-white/5">
              @{session.user.name.slice(0, 18)}
            </div>
          </div>
        </header>

        <SwipeFeed initialData={initialFeed} />
      </div>
    </main>
  );
}
