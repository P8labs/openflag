import { apiError, apiSuccess } from "@/lib/api";
import { getServerSession } from "@/lib/session";

function extractMeta(html: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const match = html.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return apiError("url is required", 400);
  }

  const url = normalizeUrl(rawUrl);
  if (!url) {
    return apiError("Invalid URL", 400);
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "OpenflagBot/1.0 (+https://openflag.local)",
      },
    });

    if (!response.ok) {
      return apiError("Unable to fetch URL metadata.", 400);
    }

    const html = await response.text();
    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      extractTitle(html);
    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "description") ??
      extractMeta(html, "twitter:description");
    const image =
      extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");

    return apiSuccess({
      url,
      title,
      description,
      image,
    });
  } catch {
    return apiError("Unable to fetch URL metadata.", 400);
  }
}
