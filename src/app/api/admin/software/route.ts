import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionValue } from "@/lib/auth";
import { createSoftwareWithRun, normalizeUrlsInput } from "@/lib/openflag";
import { SOFTWARE_TYPES, slugify } from "@/lib/software-meta";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getSession(request: NextRequest) {
  return verifyAdminSessionValue(
    request.cookies.get("openflag-admin-session")?.value,
  );
}

export async function POST(request: NextRequest) {
  if (!getSession(request)) {
    return unauthorized();
  }

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

    if (!payload?.location?.trim()) {
      throw new Error("Location is required");
    }

    const urls =
      typeof payload.urls === "string"
        ? normalizeUrlsInput(payload.urls)
        : payload.urls;

    const software = await createSoftwareWithRun({
      name: payload.name.trim(),
      type: payload.type as never,
      slug: payload.slug?.trim() ? payload.slug.trim() : slugify(payload.name),
      location: payload.location.trim(),
      description: payload.description?.trim() || null,
      logoUrl: payload.logoUrl?.trim() || null,
      urls: urls as Record<string, string>,
    });

    return NextResponse.json({
      id: software.software.id,
      slug: software.software.slug,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create software",
      },
      { status: 400 },
    );
  }
}
