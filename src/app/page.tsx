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
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto mb-5 flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Openflag</h1>
          <p className="text-sm text-muted">
            Discover, evaluate, swipe, and match.
          </p>
        </div>
      </div>
      <SwipeFeed initialData={initialFeed} />
    </main>
  );
}
