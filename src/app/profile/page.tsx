import Link from "next/link";
import { redirect } from "next/navigation";

import { UserIcon } from "@/components/app-icons";
import { MobileNav } from "@/components/mobile-nav";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <section className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <UserIcon className="size-4" />
          <p className="uppercase tracking-[0.2em]">Profile</p>
        </div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          {session.user.name}
        </h1>
        <p className="mt-1 text-sm text-white/65">
          @{profile?.username ?? "unknown"}
        </p>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-[#151b25] p-4">
          <p className="text-sm text-white/80">
            {profile?.bio ?? "No bio yet."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile?.skills ?? []).slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {profile?.username ? (
          <div className="mt-4">
            <Link
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
              href={`/${profile.username}`}
            >
              View Public Profile
            </Link>
          </div>
        ) : null}

        <MobileNav />
      </section>
    </main>
  );
}
