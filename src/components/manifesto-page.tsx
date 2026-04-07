import { Card, Chip, Link } from "@heroui/react";

export function ManifestoPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-divider bg-content1/80 p-6 backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="primary">
              Openflag manifesto
            </Chip>
            <Chip size="sm" variant="soft">
              Swipe-first collaboration
            </Chip>
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Fast discovery for builders who want to ship together.
            </h1>
            <p className="max-w-2xl text-base text-muted sm:text-lg">
              Openflag is not a feed. It is a decision engine for collaborators
              and projects. You log in, your profile assembles itself from
              GitHub, and you start swiping within seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              href="/roadmap"
            >
              Roadmap
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-divider px-4 text-sm font-medium text-foreground transition-colors hover:bg-content2"
              href="/"
            >
              Manifesto
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
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
            <Card key={item.title} className="p-5" variant="default">
              <Card.Header className="space-y-1">
                <Card.Title>{item.title}</Card.Title>
                <Card.Description>{item.body}</Card.Description>
              </Card.Header>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
