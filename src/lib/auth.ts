import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "openflag-admin-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.trim()) {
    return secret.trim();
  }

  return (
    process.env.DATABASE_URL ??
    process.env.ADMIN_PASSWORD ??
    "openflag-dev-secret"
  );
}

function sign(payload: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");
}

export function createAdminSessionValue(username: string) {
  const payload = JSON.stringify({
    username,
    issuedAt: Date.now(),
  });

  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifyAdminSessionValue(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const [payloadPart, signature] = value.split(".");

  if (!payloadPart || !signature) {
    return null;
  }

  try {
    const payload = Buffer.from(payloadPart, "base64url").toString("utf8");

    if (sign(payload) !== signature) {
      return null;
    }

    const parsed = JSON.parse(payload) as {
      username?: string;
      issuedAt?: number;
    };

    if (!parsed.username) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function adminSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
