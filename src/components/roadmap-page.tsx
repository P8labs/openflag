import { Chip } from "@heroui/react";

const roadmapItems = [
  {
    phase: "Now",
    title: "Swipe-first MVP",
    body: "Better Auth login, GitHub sync, profile completion, swipe feed, and mutual matches.",
  },
  {
    phase: "Next",
    title: "Project ownership",
    body: "Project creation, acceptance controls, and tighter relevance ranking.",
  },
  {
    phase: "Later",
    title: "Messaging and retention",
    body: "Match inbox, lightweight notifications, and richer collaboration history.",
  },
];

export function RoadmapPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3 rounded-xs border border-black/5 bg-white/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-white/5 sm:p-8">
          <Chip size="sm" variant="secondary">
            Roadmap
          </Chip>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            What ships next.
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-base">
            Keep the product narrow: discovery, intent, and matching. Everything
            else is deferred until the swipe loop is proven.
          </p>
        </header>

        <div className="divide-y divide-black/5 rounded-xs border border-black/5 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {roadmapItems.map((item) => (
            <div key={item.title} className="p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                {item.phase}
              </p>
              <p className="mt-2 text-sm font-medium tracking-tight">
                {item.title}
              </p>
              <p className="mt-2 max-w-2xl text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
