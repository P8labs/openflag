import { redirect } from "next/navigation";

import { IntegrationsSettings } from "@/components/settings/integrations-settings";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { providerId: true, accessToken: true },
  });

  return (
    <IntegrationsSettings
      githubConnected={accounts.some((item) => item.providerId === "github")}
      wakatimeConnected={accounts.some(
        (item) => item.providerId === "wakatime" && Boolean(item.accessToken),
      )}
    />
  );
}
