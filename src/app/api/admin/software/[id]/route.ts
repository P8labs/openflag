import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionValue } from "@/lib/auth";
import { normalizeUrlsInput, updateSoftwareRecord } from "@/lib/openflag";
import { SOFTWARE_STATUSES, SOFTWARE_TYPES } from "@/lib/software-meta";

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
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    string
  > | null;

  try {
    if (!payload?.name?.trim()) {
      throw new Error("Name is required");
    }

    if (
      !payload?.type?.trim() ||
      !SOFTWARE_TYPES.includes(payload.type as never)
    ) {
      throw new Error("Type is required");
    }

    if (
      !payload?.status?.trim() ||
      !SOFTWARE_STATUSES.includes(payload.status as never)
    ) {
      throw new Error("Status is required");
    }

    if (!payload?.location?.trim()) {
      throw new Error("Location is required");
    }

    const urls =
      typeof payload.urls === "string"
        ? normalizeUrlsInput(payload.urls)
        : payload.urls;

    const software = await updateSoftwareRecord(id, {
      name: payload.name.trim(),
      type: payload.type as never,
      slug: payload.slug?.trim() || payload.name.trim().toLowerCase(),
      location: payload.location.trim(),
      description: payload.description?.trim() || null,
      logoUrl: payload.logoUrl?.trim() || null,
      urls: urls as Record<string, string>,
      status: payload.status as never,
    });

    return NextResponse.json({ id: software.id, slug: software.slug });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update software",
      },
      { status: 400 },
    );
  }
}
