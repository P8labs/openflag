import { NextRequest, NextResponse } from "next/server";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { createSuggestion, normalizeUrlsInput } from "@/lib/openflag";
import { SOFTWARE_TYPES, slugify } from "@/lib/software-meta";

const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request.headers);
  const bucket = rateLimit(ip, 5, WINDOW_MS);

  if (!bucket.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
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

    const urls =
      typeof payload.urls === "string"
        ? normalizeUrlsInput(payload.urls)
        : payload.urls;

    const software = await createSuggestion({
      name: payload.name.trim(),
      type: payload.type as never,
      slug: payload.slug?.trim() ? payload.slug.trim() : slugify(payload.name),
      urls: urls as Record<string, string>,
      description: payload.description?.trim() || null,
    });

    return NextResponse.json({ id: software.id, slug: software.slug });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save suggestion",
      },
      { status: 400 },
    );
  }
}
