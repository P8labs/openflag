import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookieOptions, createAdminSessionValue } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = payload?.username?.trim();
  const password = payload?.password?.trim();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );
  }

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    "openflag-admin-session",
    createAdminSessionValue(username),
    adminSessionCookieOptions(),
  );

  return response;
}
