import { notFound } from "next/navigation";

import { Avatar } from "@heroui/react";

import { ProjectMedia } from "@/components/project-media";
import { UiCard } from "@/components/ui/card";
import { UiPill } from "@/components/ui/pill";
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
    <main className="ui-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="ui-panel grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.95fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <UiPill>Public profile</UiPill>
              <UiPill>Proof-first</UiPill>
            </div>

            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <Avatar.Image
                  alt={profile.user.name}
                  src={profile.avatar ?? undefined}
                />
                <Avatar.Fallback>
                  {profile.user.name.slice(0, 2).toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  @{profile.username}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  {profile.user.name}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm text-muted sm:text-base">
              {profile.bio ?? "No bio yet."}
            </p>

            <div className="flex flex-wrap gap-2">
              {profile.skills.slice(0, 12).map((skill) => (
                <UiPill key={skill}>{skill}</UiPill>
              ))}
            </div>
          </div>

          <UiCard>
            <UiCard.Content className="space-y-4 p-0">
              <div>
                <p className="text-sm font-medium">Signals</p>
                <p className="mt-1 text-sm text-muted">
                  Interests, availability, and collaboration style will drive
                  discovery.
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="ui-panel-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Interests
                  </p>
                  <p className="mt-2 text-foreground/80">
                    {profile.interests.length
                      ? profile.interests.join(", ")
                      : "None yet."}
                  </p>
                </div>
                <div className="ui-panel-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Availability
                  </p>
                  <p className="mt-2 text-foreground/80">
                    {profile.availability ?? "Not specified."}
                  </p>
                </div>
              </div>
            </UiCard.Content>
          </UiCard>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Public projects
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Proof of work
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profile.user.projects.map((project) => (
              <article key={project.id} className="overflow-hidden ui-panel">
                <ProjectMedia
                  className="h-56 w-full"
                  image={project.image}
                  title={project.title}
                  video={project.video}
                />
                <div className="p-4 sm:p-5">
                  <p className="text-base font-semibold tracking-tight">
                    {project.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {project.description}
                  </p>
                </div>
              </article>
            ))}
            {!profile.user.projects.length ? (
              <div className="ui-panel-muted border-dashed p-5 text-sm text-muted">
                No public projects yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
