import { Chip, Link } from "@heroui/react";

export function ManifestoPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-6 rounded-xs border border-black/5 bg-white/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="secondary">
              Openflag manifesto
            </Chip>
            <Chip size="sm" variant="soft">
              Swipe-first collaboration
            </Chip>
          </div>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Fast discovery for builders who want to ship together.
            </h1>
            <p className="max-w-2xl text-sm text-muted sm:text-base">
              Openflag is not a feed. It is a decision engine for collaborators
              and projects. You log in, your profile assembles itself from
              GitHub, and you start swiping within seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-xs border border-black/10 px-3 text-xs font-medium text-foreground transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              href="#principles"
            >
              Principles
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-xs border border-black/10 px-3 text-xs font-medium text-foreground transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              href="/roadmap"
            >
              Roadmap
            </Link>
          </div>
        </header>

        <section
          id="principles"
          className="grid gap-0 divide-y divide-black/5 rounded-xs border border-black/5 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:divide-white/10 dark:border-white/10 dark:bg-white/5"
        >
          {[
            {
              title: "Discover",
              body: "Surface relevant people and projects based on skills, interests, and activity.",
            },
            {
              title: "Evaluate",
              body: "Use short profiles and expandable cards so decisions happen in the feed.",
            },
            {
              title: "Match",
              body: "Mutual interest becomes a match. For projects, owner approval closes the loop.",
            },
          ].map((item) => (
            <div key={item.title} className="p-5 sm:p-6">
              <p className="text-sm font-medium tracking-tight">{item.title}</p>
              <p className="mt-2 max-w-xl text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
