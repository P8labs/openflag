import { redirect } from "next/navigation";

import { PostProjectForm } from "@/components/post-project-form";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function PostProjectPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  });

  return (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      <header className="rounded-xs border border-border bg-card px-4 py-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Create
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Post a project
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          @{profile?.username ?? session.user.name} · Add links, context, and
          optional WakaTime signal.
        </p>
      </header>
      <PostProjectForm />
    </div>
  );
}
