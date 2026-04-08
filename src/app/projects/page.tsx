import Link from "next/link";
import { redirect } from "next/navigation";

import { GridIcon } from "@/components/app-icons";
import { MobileNav } from "@/components/mobile-nav";
import { ProjectMedia } from "@/components/project-media";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function ProjectsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
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

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <section className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <GridIcon className="size-4" />
          <p className="uppercase tracking-[0.2em]">Projects</p>
        </div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Discover</h1>

        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="overflow-hidden rounded-[22px] border border-white/10 bg-[#151b25] p-3"
            >
              <ProjectMedia
                className="h-56 w-full"
                image={project.image}
                title={project.title}
                video={project.video}
              />
              <div className="mt-3">
                <p className="text-base font-semibold">{project.title}</p>
                <p className="mt-0.5 text-xs text-white/60">
                  by @
                  {project.owner.profileMeta?.username ?? project.owner.name}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-white/75">
                  {project.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Link
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
            href="/post-project"
          >
            Post a Project
          </Link>
        </div>

        <MobileNav />
      </section>
    </main>
  );
}
