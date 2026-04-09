import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { slugifyUsername } from "@/lib/username";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const [profile, params] = await Promise.all([
    prisma.profileMeta.findUnique({
      where: { userId: session.user.id },
    }),
    searchParams,
  ]);

  if (
    profile?.onboardingComplete &&
    profile.onboardingDetailsComplete &&
    profile.onboardingProjectComplete
  ) {
    redirect("/feed");
  }

  return (
    <main className="min-h-screen">
      <OnboardingWizard
        claimedUsername={
          params.claimed
            ? slugifyUsername(params.claimed, "builder")
            : undefined
        }
        profile={profile}
        user={{
          name: session.user.name,
          image: session.user.image ?? null,
        }}
      />
    </main>
  );
}
