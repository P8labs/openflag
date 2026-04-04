"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SOFTWARE_STATUSES,
  type SoftwareStatusValue,
} from "@/lib/software-meta";

export function AdminSoftwareRowActions({
  id,
  status,
  editHref,
  viewHref,
}: {
  id: string;
  status: SoftwareStatusValue;
  editHref: string;
  viewHref: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<SoftwareStatusValue>(status);
  const [saving, setSaving] = useState(false);

  async function updateStatus() {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/software/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground"
          >
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link href={viewHref}>View</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={editHref}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setDialogOpen(true);
            }}
          >
            Change status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
            <DialogDescription>
              Set the review state for this software entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <select
              value={nextStatus}
              onChange={(event) =>
                setNextStatus(event.target.value as SoftwareStatusValue)
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {SOFTWARE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateStatus} disabled={saving}>
              {saving ? "Saving" : "Save status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
