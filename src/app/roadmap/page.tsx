import { notFound } from "next/navigation";

import { RoadmapPage } from "@/components/roadmap-page";
import { isManifestoMode } from "@/lib/site-mode";

export default function Page() {
  if (isManifestoMode) {
    notFound();
  }

  return <RoadmapPage />;
}
