import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  redirect("/settings");
}
