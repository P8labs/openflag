import { UiLinkButton } from "@/components/ui/link-button";
import { UiPill } from "@/components/ui/pill";

export function ManifestoPage() {
  return (
    <main className="ui-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-6 rounded-xs p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <UiPill>Openflag manifesto</UiPill>
            <UiPill>Proof-of-work collaboration</UiPill>
          </div>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Builders meet here through proof, not popularity.
            </h1>
            <p className="max-w-2xl text-sm text-muted sm:text-base">
              Openflag is a trust layer for people who want to ship in public.
              You claim a username, sign in with GitHub or Google, and build a
              profile around real work instead of follower counts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <UiLinkButton href="/auth">Sign in</UiLinkButton>
            <UiLinkButton href="/roadmap">Roadmap</UiLinkButton>
          </div>
        </header>

        <section
          id="principles"
          className="grid gap-0 divide-y divide-border rounded-xs border border-border bg-surface shadow-none"
        >
          {[
            {
              title: "Proof",
              body: "Profiles and projects are shaped by real work, not vanity metrics.",
            },
            {
              title: "Trust",
              body: "Verification, circles, and streaks reward real contribution.",
            },
            {
              title: "Action",
              body: "Users discover collaborators and projects, then prove their intent with work.",
            },
          ].map((item) => (
            <div key={item.title} className="p-4 sm:p-5">
              <p className="text-sm font-medium tracking-tight">{item.title}</p>
              <p className="mt-2 max-w-xl text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
