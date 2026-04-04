import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SoftwareDetailClient } from "@/components/software-detail-client";
import { getSoftwareProgressBySlug } from "@/lib/openflag";

export default async function SoftwareDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const software = await getSoftwareProgressBySlug(slug);

  if (!software) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <SoftwareDetailClient slug={slug} initialSoftware={software} />
      </main>
    </div>
  );
}
