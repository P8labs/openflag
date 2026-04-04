import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRelativeRisk } from "@/lib/format";
import type { SoftwareCardRecord } from "@/lib/openflag";

function riskStyles(riskScore: number | null | undefined) {
  if (typeof riskScore !== "number") {
    return "border-border bg-muted text-muted-foreground";
  }

  if (riskScore <= 30) {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-900";
  }

  if (riskScore <= 70) {
    return "border-amber-200/80 bg-amber-50 text-amber-900";
  }

  return "border-rose-200/80 bg-rose-50 text-rose-900";
}

export function SoftwareCard({ software }: { software: SoftwareCardRecord }) {
  const riskScore = software.analysis?.riskScore;

  return (
    <Card className="group border-border/70 bg-background shadow-none transition-colors hover:border-foreground/15">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11 rounded-xl border border-border/70 bg-muted">
            <AvatarImage
              src={software.logoUrl ?? undefined}
              alt={software.name}
            />
            <AvatarFallback className="rounded-xl text-xs font-medium text-muted-foreground">
              {software.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-foreground">
                {software.name}
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full border border-border/70 bg-muted/60 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {software.type}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {software.slug}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
            riskStyles(riskScore),
          )}
        >
          Risk {typeof riskScore === "number" ? `${riskScore}/100` : "Pending"}
          <span className="ml-2 text-[10px] uppercase tracking-[0.18em] opacity-70">
            {formatRelativeRisk(riskScore)}
          </span>
        </div>

        {software.analysis?.verdict ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {software.analysis.verdict}
          </p>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Queued for review.
          </p>
        )}

        <Link
          href={`/software/${software.slug}`}
          className="inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          View analysis
        </Link>
      </CardContent>
    </Card>
  );
}
