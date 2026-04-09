import { redirect } from "next/navigation";

import { ProjectMedia } from "@/components/project-media";
import { UiLinkButton } from "@/components/ui/link-button";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function ProjectsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    include: {
      owner: {
        select: {
          name: true,
          profileMeta: {
            select: { username: true },
          },
        },
      },
    },
    orderBy: { recentActivityAt: "desc" },
    take: 40,
  });

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  });

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <header className="ui-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Projects
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Discover</h1>
        <p className="mt-2 text-sm text-muted">
          @{profile?.username ?? session.user.name}
        </p>
      </header>

      <div className="space-y-3">
        {projects.map((project) => (
          <article key={project.id} className="overflow-hidden ui-panel p-3">
            <ProjectMedia
              className="h-56 w-full"
              image={project.image}
              title={project.title}
              video={project.video}
            />
            <div className="mt-3">
              <p className="text-base font-semibold">{project.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                by @{project.owner.profileMeta?.username ?? project.owner.name}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-foreground/75">
                {project.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="pt-2">
        <UiLinkButton variant="primary" href="/post-project">
          Post a Project
        </UiLinkButton>
      </div>
    </div>
  );
}
