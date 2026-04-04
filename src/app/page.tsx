import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { SoftwareCard } from "@/components/software-card";
import { getLandingSoftware } from "@/lib/openflag";

export default async function HomePage() {
  const softwares = await getLandingSoftware();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16 md:py-24">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Openflag
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Understand what software does with your data.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            Privacy analysis that stays calm, structured, and readable.
          </p>

          <form
            action="/explore"
            method="get"
            className="mt-10 w-full max-w-2xl"
          >
            <div className="flex flex-col gap-3 rounded-full border border-border/70 bg-background p-2 shadow-none md:flex-row md:items-center">
              <Input
                name="q"
                defaultValue=""
                placeholder="Search software by name or slug"
                className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
              <Button type="submit" className="h-12 rounded-full px-6">
                Search
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-border/70 bg-background shadow-none"
            >
              <Link href="/explore">Explore</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-4">
              <Link href="/about">About</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Active software
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Recently reviewed
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {softwares.map((software) => (
              <SoftwareCard key={software.id} software={software} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
