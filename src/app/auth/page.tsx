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
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="p-5 sm:p-6 lg:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Auth entry
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Sign in, then keep building.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted sm:text-base">
            GitHub and Google are the only entry points. We hydrate your avatar,
            then send you into onboarding so the profile starts with proof.
          </p>

          {claimedUsername ? (
            <div className="ui-panel-muted mt-6 p-4 text-sm text-foreground/75">
              Claimed handle: @{claimedUsername}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm text-muted">
            <p>No passwords.</p>
            <p>No email signup form.</p>
            <p>Just identity, onboarding, and proof of work.</p>
          </div>
        </Card>

        <SignInCard claimedUsername={claimedUsername} />
      </div>
    </main>
  );
}
