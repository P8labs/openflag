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
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <header className="ui-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Create</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Post Project
        </h1>
        <p className="mt-2 text-sm text-muted">
          @{profile?.username ?? session.user.name}
        </p>
      </header>

      <PostProjectForm />
    </div>
  );
}
