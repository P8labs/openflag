import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminSoftwareForm } from "@/components/admin-software-form";

export default function NewSoftwarePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            New software
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Create entry
          </h2>
        </div>

        <Button
          asChild
          variant="outline"
          className="rounded-full border-border/70 bg-background shadow-none"
        >
          <Link href="/admin/software">Back</Link>
        </Button>
      </div>

      <AdminSoftwareForm mode="create" submitUrl="/api/admin/software" />
    </div>
  );
}
