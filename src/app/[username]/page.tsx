import { notFound } from "next/navigation";

import { ProjectMedia } from "@/components/project-media";
import { prisma } from "@/lib/prisma";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profile = await prisma.profileMeta.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          name: true,
          projects: {
            where: { isActive: true },
            orderBy: { recentActivityAt: "desc" },
            take: 12,
          },
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-95 overflow-hidden rounded-[34px] border border-white/10 bg-[#0c1018] p-4 text-white shadow-[0_30px_90px_rgba(3,6,12,0.5)] sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Public Profile
        </p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          {profile.user.name}
        </h1>
        <p className="mt-1 text-sm text-white/65">@{profile.username}</p>
        <p className="mt-3 text-sm text-white/80">
          {profile.bio ?? "No bio yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.slice(0, 12).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {profile.user.projects.map((project) => (
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
              <p className="mt-3 text-base font-semibold">{project.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-white/75">
                {project.description}
              </p>
            </article>
          ))}
          {!profile.user.projects.length ? (
            <p className="rounded-[20px] border border-white/10 bg-[#151b25] px-4 py-3 text-sm text-white/70">
              No public projects yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
