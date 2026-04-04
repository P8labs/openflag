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

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <p>
        Use Openflag as an informational product. It is designed to summarize
        public-facing software information.
      </p>
      <p>
        Do not rely on it as legal advice or as a substitute for your own
        review.
      </p>
    </LegalPage>
  );
}
