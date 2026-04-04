import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatRelativeRisk } from "@/lib/format";
import {
  getAdminSoftwarePage,
  type SoftwareStatusValue,
  type SoftwareTypeValue,
} from "@/lib/openflag";
import { AdminSoftwareRowActions } from "@/components/admin-software-row-actions";
import { SOFTWARE_STATUSES, SOFTWARE_TYPES } from "@/lib/software-meta";

function badgeClass(status: SoftwareStatusValue) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "PROCESSING":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export default async function AdminSoftwareListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : "";
  const status =
    typeof params.status === "string"
      ? (params.status as SoftwareStatusValue)
      : null;
  const type =
    typeof params.type === "string" ? (params.type as SoftwareTypeValue) : null;

  const result = await getAdminSoftwarePage({
    search,
    status,
    type,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Software
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Review queue
          </h2>
        </div>

        <Button asChild className="rounded-full">
          <Link href="/admin/software/new">New software</Link>
        </Button>
      </div>

      <form
        method="get"
        className="grid gap-4 rounded-2xl border border-border/70 bg-background p-4 md:grid-cols-4"
      >
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={search}
            placeholder="Name or slug"
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">All statuses</option>
            {SOFTWARE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <select
            name="type"
            defaultValue={type ?? ""}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">All types</option>
            {SOFTWARE_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 flex justify-end">
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-border/70 bg-background shadow-none"
          >
            Apply filters
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border/70 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((software) => {
              const latestRun = software.runs[0] ?? null;

              return (
                <TableRow key={software.id}>
                  <TableCell className="font-medium">{software.name}</TableCell>
                  <TableCell>{software.type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {software.slug}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        className={`rounded-full border ${badgeClass(software.status)}`}
                      >
                        {software.status}
                      </Badge>
                      {software.analysis?.riskScore !== undefined ? (
                        <p className="text-xs text-muted-foreground">
                          Risk {software.analysis.riskScore}/100 ·{" "}
                          {formatRelativeRisk(software.analysis.riskScore)}
                        </p>
                      ) : latestRun?.status ? (
                        <p className="text-xs text-muted-foreground">
                          Run {latestRun.status}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(software.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground"
                      >
                        <Link href={`/admin/software/${software.id}`}>
                          View
                        </Link>
                      </Button>
                      <AdminSoftwareRowActions
                        id={software.id}
                        status={software.status}
                        viewHref={`/admin/software/${software.id}`}
                        editHref={`/admin/software/${software.id}/edit`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {result.items.length} of {result.totalCount}
        </p>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            disabled={result.page <= 1}
            className="rounded-full border-border/70 bg-background shadow-none"
          >
            <Link
              href={`?${new URLSearchParams({ q: search, status: status ?? "", type: type ?? "", page: String(Math.max(1, result.page - 1)) })}`}
            >
              Previous
            </Link>
          </Button>
          <span className="px-2">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            asChild
            variant="outline"
            disabled={result.page >= result.totalPages}
            className="rounded-full border-border/70 bg-background shadow-none"
          >
            <Link
              href={`?${new URLSearchParams({ q: search, status: status ?? "", type: type ?? "", page: String(Math.min(result.totalPages, result.page + 1)) })}`}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
