import { LandingPage } from "@/components/landing-page";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
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

  return <LandingPage />;
}
