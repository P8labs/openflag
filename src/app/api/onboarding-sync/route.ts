import { headers } from "next/headers";

import { apiError, apiSuccess } from "@/lib/api";
import { seedProfileFromAuth } from "@/lib/github-sync";
import { getServerSession } from "@/lib/session";

export async function POST() {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const result = await seedProfileFromAuth({
    userId: session.user.id,
    useHeaderFallback: await headers(),
  });

  return apiSuccess(result);
}
