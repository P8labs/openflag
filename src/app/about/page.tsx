import { SiteHeader } from "@/components/site-header";

function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Openflag
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 space-y-4 text-sm leading-7 text-muted-foreground">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AboutPage() {
  return (
    <LegalPage title="About">
      <p>
        Openflag is a privacy-focused software analysis platform built for fast,
        readable review.
      </p>
      <p>
        It turns policy and product signals into concise risk notes, data flow
        summaries, and practical guidance.
      </p>
      <p>The goal is clarity, not legal advice.</p>
    </LegalPage>
  );
}
