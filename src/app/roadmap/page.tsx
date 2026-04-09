import { UiLinkButton } from "@/components/ui/link-button";
import { UiPill } from "@/components/ui/pill";

export default function RoadmapPage() {
  return (
    <main className="ui-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="ui-panel p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap gap-2">
            <UiPill>Public page</UiPill>
            <UiPill>Product direction</UiPill>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Roadmap for the swipe-first collaboration loop.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted sm:text-base">
            This page stays public so the product direction is visible before
            sign in. Private app routes remain guarded by Proxy.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <UiLinkButton href="/">Back to app</UiLinkButton>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Identity",
              body: "Claim usernames, import avatars, and finish the required profile step first.",
            },
            {
              title: "Proof",
              body: "Project posts, Wakatime, PRs, and issues become the proof layer.",
            },
            {
              title: "Trust",
              body: "Circles, verification, and streaks reward useful interaction instead of noise.",
            },
          ].map((item) => (
            <article key={item.title} className="ui-panel p-4 sm:p-5">
              <p className="text-sm font-medium tracking-tight">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
