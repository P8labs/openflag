import { NextResponse } from "next/server";
import { getSoftwareProgressBySlug } from "@/lib/openflag";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const software = await getSoftwareProgressBySlug(slug);

  if (!software) {
    return NextResponse.json(
      { software: null, status: "UNKNOWN" },
      { status: 404 },
    );
  }

  const latestRun = software.runs[0] ?? null;

  return NextResponse.json({
    software,
    run: latestRun,
    status: software.analysis
      ? software.status
      : (latestRun?.status ?? software.status),
  });
}
