import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { syncGithubOnboarding } from "@/lib/github-sync";
import { getServerSession } from "@/lib/session";

export async function POST() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncGithubOnboarding({
    userId: session.user.id,
    useHeaderFallback: await headers(),
  });

  return NextResponse.json(result);
}
