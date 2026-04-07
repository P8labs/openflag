import { Card, Chip } from "@heroui/react";

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
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-3">
          <Chip size="sm" variant="soft">
            Roadmap
          </Chip>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            What ships next.
          </h1>
          <p className="max-w-2xl text-muted">
            Keep the product narrow: discovery, intent, and matching. Everything
            else is deferred until the swipe loop is proven.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {roadmapItems.map((item) => (
            <Card key={item.title} className="p-5" variant="default">
              <Card.Header className="space-y-1">
                <Card.Description>{item.phase}</Card.Description>
                <Card.Title>{item.title}</Card.Title>
                <Card.Description>{item.body}</Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
