import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminSoftwareRowActions } from "@/components/admin-software-row-actions";
import { SoftwareDetailClient } from "@/components/software-detail-client";
import { formatDateTime } from "@/lib/format";
import { getSoftwareProgressById } from "@/lib/openflag";

export default async function AdminSoftwareViewPage({
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Software
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {software.name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-border/70 bg-background shadow-none"
          >
            <Link href={`/admin/software/${software.id}/edit`}>Edit</Link>
          </Button>
          <AdminSoftwareRowActions
            id={software.id}
            status={software.status}
            viewHref={`/admin/software/${software.id}`}
            editHref={`/admin/software/${software.id}/edit`}
          />
        </div>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Type
            </p>
            <p className="mt-2 text-sm text-foreground">{software.type}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Slug
            </p>
            <p className="mt-2 text-sm text-foreground">{software.slug}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Created
            </p>
            <p className="mt-2 text-sm text-foreground">
              {formatDateTime(software.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <SoftwareDetailClient slug={software.slug} initialSoftware={software} />
    </div>
  );
}
