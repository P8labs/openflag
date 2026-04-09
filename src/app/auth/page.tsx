import { redirect } from "next/navigation";

import { SignInCard } from "@/components/sign-in-card";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { slugifyUsername } from "@/lib/username";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const session = await getServerSession();

  if (session) {
    const profile = await prisma.profileMeta.findUnique({
      where: { userId: session.user.id },
      select: {
        onboardingComplete: true,
        onboardingDetailsComplete: true,
        onboardingProjectComplete: true,
      },
    });

    if (!profile?.onboardingComplete) {
      redirect("/onboarding");
    }

    redirect("/feed");
  }

  const { username } = await searchParams;
  const claimedUsername = username
    ? slugifyUsername(username, "builder")
    : undefined;

  return (
    <main className="flex items-center justify-center min-h-screen">
      <SignInCard claimedUsername={claimedUsername} />
    </main>
  );
}
