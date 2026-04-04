"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeRisk } from "@/lib/format";
import type { SoftwareDetailRecord, SoftwareStatusValue } from "@/lib/openflag";

type Snapshot = {
  software: SoftwareDetailRecord | null;
  status: SoftwareStatusValue | "UNKNOWN" | "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  ready: boolean;
};

function readValue(source: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function riskTone(score?: number | null) {
  if (typeof score !== "number") {
    return "border-border bg-muted text-muted-foreground";
  }

  if (score <= 30) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (score <= 70) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-rose-200 bg-rose-50 text-rose-900";
}

function ProgressStage({
  title,
  detail,
  active,
}: {
  title: string;
  detail: string;
  active: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", active ? "border-foreground/15 bg-background" : "border-border/60 bg-muted/30")}> 
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
              <p>{item}</p>
            </div>
          ))
        ) : (
          <p>Nothing recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SoftwareDetailClient({
  slug,
  initialSoftware,
}: {
  slug: string;
  initialSoftware: SoftwareDetailRecord | null;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    software: initialSoftware,
    status: initialSoftware?.status ?? "UNKNOWN",
    ready: Boolean(initialSoftware?.analysis ?? initialSoftware?.runs[0]?.final),
  });

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const response = await fetch(`/api/software/${slug}/status`, { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          software: SoftwareDetailRecord | null;
          status: SoftwareStatusValue | "UNKNOWN";
        };

        if (!active) {
          return;
        }

        setSnapshot({
          software: data.software,
          status: data.status,
          ready: Boolean(data.software?.analysis),
        });
      } catch {
        // polling is best-effort
      }
    }

    poll();
    const interval = window.setInterval(poll, 4000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [slug]);

  const software = snapshot.software;
  const analysis = software?.analysis ?? software?.runs[0]?.final ?? null;
  const run = software?.runs[0] ?? null;
  const analysisRecord = analysis && typeof analysis === "object" ? (analysis as Record<string, unknown>) : null;
  const riskValue = readValue(analysisRecord, ["riskScore", "risk_score"]);
  const riskScore = typeof riskValue === "number" ? riskValue : riskValue !== undefined ? Number(riskValue) : undefined;
  const verdict = readValue(analysisRecord, ["verdict"]) as string | undefined;
  const quickTake = readValue(analysisRecord, ["quickTake", "quick_take"]) as string | undefined;

  const stage1Items = useMemo(() => {
    const value = run?.stage1 as { main_points?: string[] } | null;
    return value?.main_points ?? [];
  }, [run?.stage1]);

  const stage2 = run?.stage2 as
    | {
        quick_take?: string;
        what_matters?: string[];
        data_flow?: string[];
        feature_policies?: string[];
      }
    | null;

  const stage3 = run?.stage3 as
    | {
        red_flags?: string[];
        yellow_flags?: string[];
        green_flags?: string[];
        best_practices?: string[];
        bad_practices?: string[];
        risk_score?: number;
      }
    | null;

  if (!software) {
    return (
      <Card className="border-border/70 shadow-none">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-12 w-40 rounded-2xl" />
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (!snapshot.ready) {
    const stageLabel = snapshot.status === "PENDING" ? "Queued" : snapshot.status === "PROCESSING" ? "Processing" : "Review pending";

    return (
      <div className="space-y-8">
        <Card className="border-border/70 shadow-none">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 rounded-2xl border border-border/70 bg-muted">
                  <AvatarImage src={software.logoUrl ?? undefined} alt={software.name} />
                  <AvatarFallback className="rounded-2xl text-sm font-medium">{software.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Software detail</p>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">{software.name}</h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{software.description ?? "We are preparing the review."}</p>
                </div>
              </div>

              <div className={cn("inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium", riskTone(riskScore))}>
                {stageLabel}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ProgressStage title="Stage 1" detail={stage1Items.length > 0 ? stage1Items[0] : "Extracting the main points from the policy."} active={Boolean(run?.stage1)} />
              <ProgressStage title="Stage 2" detail={stage2?.quick_take ?? "Turning those points into user-facing insights."} active={Boolean(run?.stage2)} />
              <ProgressStage title="Stage 3" detail={stage3?.red_flags?.[0] ?? "Scoring the risk profile and classifying the flags."} active={Boolean(run?.stage3)} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <SectionList title="Queued work" items={stage1Items.length > 0 ? stage1Items : ["Waiting for the worker to start."]} />
          <SectionList title="Signals" items={stage2?.what_matters ?? ["No extracted insights yet."]} />
          <SectionList title="Risk" items={stage3?.red_flags ?? ["No risk verdict yet."]} />
        </div>
      </div>
    );
  }

  const redFlags = analysis && typeof analysis === "object" ? ((analysis as { redFlags?: string[] }).redFlags ?? []) : [];
  const yellowFlags = analysis && typeof analysis === "object" ? ((analysis as { yellowFlags?: string[] }).yellowFlags ?? []) : [];
  const greenFlags = analysis && typeof analysis === "object" ? ((analysis as { greenFlags?: string[] }).greenFlags ?? []) : [];
  const whatMatters = analysis && typeof analysis === "object" ? ((analysis as { whatMatters?: string[] }).whatMatters ?? []) : [];
  const dataFlow = analysis && typeof analysis === "object" ? ((analysis as { dataFlow?: string[] }).dataFlow ?? []) : [];
  const featurePolicies = analysis && typeof analysis === "object" ? ((analysis as { featurePolicies?: string[] }).featurePolicies ?? []) : [];
  const bestPractices = analysis && typeof analysis === "object" ? ((analysis as { bestPractices?: string[] }).bestPractices ?? []) : [];
  const badPractices = analysis && typeof analysis === "object" ? ((analysis as { badPractices?: string[] }).badPractices ?? []) : [];

  return (
    <div className="space-y-8">
      <Card className="border-border/70 shadow-none">
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-2xl border border-border/70 bg-muted">
                <AvatarImage src={software.logoUrl ?? undefined} alt={software.name} />
                <AvatarFallback className="rounded-2xl text-sm font-medium">{software.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Software detail</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{software.name}</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{software.description ?? "Review complete."}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className={cn("inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium", riskTone(riskScore))}>
                Risk {typeof riskScore === "number" ? `${riskScore}/100` : "—"}
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] opacity-70">{formatRelativeRisk(riskScore)}</span>
              </div>
              {verdict ? <p className="text-sm text-muted-foreground">{verdict}</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">QuickTake</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground">{quickTake ?? (readValue(analysisRecord, ["quickTake", "quick_take"]) as string | undefined) ?? "No quick take available."}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionList title="Red Flags" items={redFlags} />
        <SectionList title="Yellow Flags" items={yellowFlags} />
        <SectionList title="Green Flags" items={greenFlags} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionList title="What Matters" items={whatMatters} />
        <SectionList title="Data Flow" items={dataFlow} />
        <SectionList title="Feature Policies" items={featurePolicies} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionList title="Best Practices" items={bestPractices} />
        <SectionList title="Bad Practices" items={badPractices} />
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="rounded-full border-border/70 bg-background shadow-none">
          <Link href={`/explore?q=${encodeURIComponent(software.name)}`}>Explore similar</Link>
        </Button>
      </div>
    </div>
  );
}
