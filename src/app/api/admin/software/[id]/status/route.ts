import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionValue } from "@/lib/auth";
import { updateSoftwareStatus } from "@/lib/openflag";
import { SOFTWARE_STATUSES } from "@/lib/software-meta";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getSession(request: NextRequest) {
  return verifyAdminSessionValue(
    request.cookies.get("openflag-admin-session")?.value,
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getSession(request)) {
    return unauthorized();
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as {
    status?: string;
  } | null;

  if (!payload?.status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  if (!SOFTWARE_STATUSES.includes(payload.status as never)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const software = await updateSoftwareStatus(id, payload.status as never);
    return NextResponse.json({ id: software.id, status: software.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update status",
      },
      { status: 400 },
    );
  }
}
