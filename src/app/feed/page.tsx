import { redirect } from "next/navigation";

import { SwipeFeed } from "@/components/swipe-feed";
import { getFeedPage } from "@/lib/feed";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function FeedPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  });

  if (!profile?.onboardingComplete) {
    redirect("/");
  }

  const initialFeed = await getFeedPage({
    userId: session.user.id,
    limit: 12,
  });

  return (
    <main className="min-h-screen bg-[#080b12]">
      <div className="mx-auto flex w-full max-w-3xl justify-center">
        <SwipeFeed initialData={initialFeed} />
      </div>
    </main>
  );
}
