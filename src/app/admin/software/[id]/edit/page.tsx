import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminSoftwareForm } from "@/components/admin-software-form";
import { getSoftwareProgressById } from "@/lib/openflag";

export default async function EditSoftwarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const software = await getSoftwareProgressById(id);

  if (!software) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Edit software
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {software.name}
          </h2>
        </div>

        <Button
          asChild
          variant="outline"
          className="rounded-full border-border/70 bg-background shadow-none"
        >
          <Link href={`/admin/software/${software.id}`}>Back</Link>
        </Button>
      </div>

      <AdminSoftwareForm
        mode="edit"
        submitUrl={`/api/admin/software/${software.id}`}
        initialValues={{
          name: software.name,
          type: software.type,
          slug: software.slug,
          location: software.location,
          description: software.description ?? "",
          logoUrl: software.logoUrl ?? "",
          urls: JSON.stringify(software.urls, null, 2),
          status: software.status,
        }}
      />
    </div>
  );
}
