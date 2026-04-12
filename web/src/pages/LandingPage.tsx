import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Openflag</Badge>
            <Badge variant="outline">Proof-first</Badge>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl leading-tight">
              Show what you build. <br className="hidden sm:block" />
              Find people doing the same.
            </h1>

            <p className="text-sm text-muted-foreground max-w-md sm:text-base">
              No followers. No noise. Just real work — linked with GitHub,
              Wakatime, and actual progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button className="rounded-md">Get started</Button>
            </Link>
            <p className="text-xs text-muted-foreground">Takes ~30 seconds</p>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            How it works
          </p>

          <div className="flex flex-col divide-y divide-border border border-border rounded-md">
            {[
              {
                title: "Claim your identity",
                body: "Pick a username and sign in with GitHub or Google.",
              },
              {
                title: "Post your work",
                body: "Share PRs, commits, or time logs. Not just words.",
              },
              {
                title: "Find real builders",
                body: "Discover people and projects through actual work.",
              },
            ].map((item) => (
              <div key={item.title} className="p-4 sm:p-5">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Why this exists
          </p>

          <p className="text-lg font-medium tracking-tight max-w-xl">
            Most platforms reward attention. Openflag rewards work.
          </p>

          <p className="text-sm text-muted-foreground max-w-md">
            If you are building, it should be visible. If not, there is nothing
            to fake.
          </p>
        </section>

        <section className="flex items-center justify-between border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Start building in public
          </p>

          <Link to="/auth">
            <Button className="rounded-md">Continue</Button>
          </Link>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Openflag, From{" "}
            <a href="https://p8labs.in" className="hover:underline">
              P8labs
            </a>
          </p>
          <div className="flex items-center gap-3">
            <Link to="/policy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
