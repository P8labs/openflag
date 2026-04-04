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

export default function DmcaPage() {
  return (
    <LegalPage title="DMCA">
      <p>
        If you believe content on Openflag infringes your rights, contact the
        site owner with the relevant URL and a concise description of the issue.
      </p>
      <p>
        We will review the request and take appropriate action where necessary.
      </p>
    </LegalPage>
  );
}
