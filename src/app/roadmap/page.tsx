import { Chip, Link } from "@heroui/react";

export default function RoadmapPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[28px] border border-black/5 bg-white/75 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="secondary">
              Public page
            </Chip>
            <Chip size="sm" variant="soft">
              Product direction
            </Chip>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Roadmap for the swipe-first collaboration loop.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted sm:text-base">
            This page stays public so the product story is visible before sign
            in. Private app routes remain guarded by Proxy.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className="no-underline inline-flex h-10 items-center justify-center rounded-xs border border-black/10 px-4 text-sm font-medium text-foreground transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              href="/"
            >
              Back to app
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Discovery",
              body: "Rank people and projects by signal from GitHub, profile context, and recent activity.",
            },
            {
              title: "Commitment",
              body: "A right swipe can become a match, and projects can star repositories directly.",
            },
            {
              title: "Focus",
              body: "Keep the feed private, lightweight, and fast so the product stays usable on first load.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-black/5 bg-white/70 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-sm font-medium tracking-tight">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
