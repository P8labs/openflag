import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Openflag manifesto</Badge>
            <Badge variant="outline">Proof-of-work collaboration</Badge>
          </div>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Builders meet here through proof, not popularity.
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Openflag is a trust layer for people who want to ship in public.
              You claim a username, sign in with GitHub or Google, and build a
              profile around real work instead of follower counts.
            </p>
          </div>
        </header>

        <section id="principles" className="grid">
          <ol className="">
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
              <li
                key={item.title}
                className="p-4 sm:p-5 border border-border first:rounded-t-md last:rounded-b-md hover:bg-accent/20 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium tracking-tight">
                  {item.title}
                </p>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <Link to="/auth">
            <Button>Get Started Now</Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
