import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { SoftwareCard } from "@/components/software-card";
import { SuggestSoftwareDialog } from "@/components/suggest-software-dialog";
import { formatRelativeRisk } from "@/lib/format";
import { getExploreSoftware } from "@/lib/openflag";
import {
  SOFTWARE_RISK_BANDS,
  SOFTWARE_TYPES,
  type RiskBandKey,
  type SoftwareTypeValue,
} from "@/lib/software-meta";

function readString(param: string | string[] | undefined) {
  return typeof param === "string" ? param : "";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = readString(params.q);
  const type = readString(params.type) as SoftwareTypeValue | "";
  const risk = readString(params.risk) as RiskBandKey | "";
  const page = Number(readString(params.page) || "1") || 1;

  const result = await getExploreSoftware({
    search,
    type: type || null,
    riskBand: risk || null,
    page,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-3xl border border-border/70 bg-background p-5 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Explore
              </p>
              <h1 className="text-xl font-semibold tracking-tight">Filters</h1>
            </div>
            <SuggestSoftwareDialog />
          </div>

          <form method="get" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={search}
                placeholder="Name or slug"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <select
                name="type"
                defaultValue={type || ""}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">All types</option>
                {SOFTWARE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Risk level</Label>
              <select
                name="risk"
                defaultValue={risk || ""}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">All levels</option>
                {SOFTWARE_RISK_BANDS.map((band) => (
                  <option key={band.key} value={band.key}>
                    {band.label}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full rounded-full">
              Apply
            </Button>
          </form>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-foreground">Risk ranges</p>
            <div className="mt-3 space-y-2">
              {SOFTWARE_RISK_BANDS.map((band) => (
                <div
                  key={band.key}
                  className="flex items-center justify-between"
                >
                  <span>{band.label}</span>
                  <span>
                    {band.min}-{band.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Results
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {result.totalCount} software entries
              </h2>
            </div>

            {search || type || risk ? (
              <div className="flex flex-wrap items-center gap-2">
                {search ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-border/70 bg-muted/60 text-foreground"
                  >
                    {search}
                  </Badge>
                ) : null}
                {type ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-border/70 bg-muted/60 text-foreground"
                  >
                    {type}
                  </Badge>
                ) : null}
                {risk ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-border/70 bg-muted/60 text-foreground"
                  >
                    {formatRelativeRisk(
                      risk === "low" ? 10 : risk === "medium" ? 50 : 85,
                    )}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((software) => (
              <SoftwareCard key={software.id} software={software} />
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Page {result.page} of {result.totalPages}
            </p>
            <div className="flex items-center gap-2">
              {result.page <= 1 ? (
                <Button
                  variant="outline"
                  disabled
                  className="rounded-full border-border/70 bg-background shadow-none"
                >
                  Previous
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-border/70 bg-background shadow-none"
                >
                  <Link
                    href={`?${new URLSearchParams({ q: search, type, risk, page: String(Math.max(1, result.page - 1)) })}`}
                  >
                    Previous
                  </Link>
                </Button>
              )}
              {result.page >= result.totalPages ? (
                <Button
                  variant="outline"
                  disabled
                  className="rounded-full border-border/70 bg-background shadow-none"
                >
                  Next
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-border/70 bg-background shadow-none"
                >
                  <Link
                    href={`?${new URLSearchParams({ q: search, type, risk, page: String(Math.min(result.totalPages, result.page + 1)) })}`}
                  >
                    Next
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
