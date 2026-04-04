import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type SeedAnalysis = {
  quickTake: string;
  verdict: string;
  riskScore: number;
  redFlags: string[];
  yellowFlags: string[];
  greenFlags: string[];
  whatMatters: string[];
  dataFlow: string[];
  featurePolicies: string[];
  bestPractices: string[];
  badPractices: string[];
};

type SeedRun = {
  id: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  stage1: Prisma.InputJsonValue | null;
  stage2: Prisma.InputJsonValue | null;
  stage3: Prisma.InputJsonValue | null;
  final: Prisma.InputJsonValue | null;
};

type SeedSoftware = {
  slug: string;
  name: string;
  type: "WEB" | "MOBILE" | "CLI" | "OS" | "UTIL";
  location: string;
  description: string;
  status: "PRE_REVIEWED" | "PROCESSING" | "PROCESSED" | "ACTIVE" | "FAILED";
  urls: Record<string, string>;
  analysis?: SeedAnalysis;
  run?: SeedRun;
};

const softwares: SeedSoftware[] = [
  {
    slug: "signal",
    name: "Signal",
    type: "MOBILE",
    location: "https://signal.org",
    description:
      "Private messaging with minimal data collection and clear product boundaries.",
    status: "ACTIVE",
    urls: {
      home: "https://signal.org",
      privacy: "https://signal.org/legal/",
    },
    analysis: {
      quickTake:
        "Signal keeps the privacy story simple: minimal metadata, strong defaults, and no ad network dependency.",
      verdict: "Use with confidence",
      riskScore: 12,
      redFlags: ["Needs a phone number for account setup"],
      yellowFlags: ["Some device metadata is still required for delivery"],
      greenFlags: [
        "Open source client",
        "End-to-end encrypted messages",
        "Low data retention",
      ],
      whatMatters: [
        "Messaging is end-to-end encrypted",
        "Metadata collection is deliberately limited",
      ],
      dataFlow: [
        "Messages stay encrypted between devices",
        "No ad-tech sharing layer",
      ],
      featurePolicies: [
        "Registration uses phone number verification",
        "Disappearing messages are available",
      ],
      bestPractices: ["Minimal profile data", "Clear privacy defaults"],
      badPractices: ["Phone number requirement"],
    },
    run: {
      id: "run-signal",
      status: "DONE",
      stage1: {
        main_points: [
          "Collects minimal account data",
          "Messages are end-to-end encrypted",
        ],
      },
      stage2: {
        quick_take:
          "Signal keeps collected data narrow while protecting message content.",
        what_matters: ["No ad tracking", "Limited metadata"],
        flags: ["Phone number signup"],
        verdict: "Safe",
        data_flow: ["Encrypted delivery only"],
        feature_policies: ["Disappearing messages"],
      },
      stage3: {
        red_flags: ["Phone number required"],
        yellow_flags: ["Some metadata remains necessary"],
        green_flags: ["Open source", "Encryption by default"],
        best_practices: ["Minimal retention", "Clear controls"],
        bad_practices: ["Account setup friction"],
        risk_score: 12,
      },
      final: {
        quick_take:
          "Signal keeps data collection narrow and protects content with strong encryption.",
        verdict: "Use with confidence",
        flags: {
          red: ["Phone number required"],
          yellow: ["Some metadata is still needed"],
          green: ["Open source", "End-to-end encryption"],
        },
        risk_score: 12,
        what_matters: ["Encrypted messages", "Minimal metadata"],
        data_flow: ["Encrypted peer-to-peer delivery"],
        feature_policies: ["Disappearing messages"],
        best_practices: ["Default encryption", "Low data retention"],
        bad_practices: ["Phone number requirement"],
        raw_points: [
          "Collects minimal account data",
          "Messages are end-to-end encrypted",
        ],
      },
    },
  },
  {
    slug: "notion",
    name: "Notion",
    type: "WEB",
    location: "https://notion.so",
    description:
      "Flexible workspace with broad collaboration features and a moderate privacy footprint.",
    status: "ACTIVE",
    urls: {
      home: "https://www.notion.so",
      privacy: "https://www.notion.so/privacy",
    },
    analysis: {
      quickTake:
        "Notion is useful and transparent enough for most teams, but its collaborative surface creates a broader data footprint.",
      verdict: "Use with caution",
      riskScore: 44,
      redFlags: ["Broad workspace content collection"],
      yellowFlags: [
        "Account and usage telemetry",
        "Third-party integrations can expand sharing",
      ],
      greenFlags: ["Exports available", "Permission controls"],
      whatMatters: [
        "Workspace content is central to the product",
        "Sharing settings matter a lot",
      ],
      dataFlow: [
        "Content stored in Notion cloud",
        "Integrations may transmit data to partners",
      ],
      featurePolicies: [
        "Team-level collaboration defaults",
        "Admin controls for enterprise plans",
      ],
      bestPractices: ["Export controls", "Granular permissions"],
      badPractices: ["Wide content surface", "Integration sprawl"],
    },
    run: {
      id: "run-notion",
      status: "DONE",
      stage1: {
        main_points: [
          "Workspace content is stored centrally",
          "Integrations can extend sharing",
        ],
      },
      stage2: {
        quick_take:
          "The product is useful, but the collaboration model broadens the data surface.",
        what_matters: ["Content storage", "Integration permissions"],
        flags: ["Broad collection"],
        verdict: "Use with caution",
        data_flow: ["Cloud storage", "Partner integrations"],
        feature_policies: ["Admin controls"],
      },
      stage3: {
        red_flags: ["Broad workspace content collection"],
        yellow_flags: ["Telemetry and integrations"],
        green_flags: ["Exports available", "Permission controls"],
        best_practices: ["Granular access control"],
        bad_practices: ["Wide content surface"],
        risk_score: 44,
      },
      final: {
        quick_take:
          "Notion is practical and transparent enough, but the collaboration model means more of your content lives in one place.",
        verdict: "Use with caution",
        flags: {
          red: ["Broad workspace content collection"],
          yellow: ["Telemetry and integrations"],
          green: ["Exports available", "Permission controls"],
        },
        risk_score: 44,
        what_matters: ["Content storage", "Sharing rules"],
        data_flow: ["Cloud-hosted workspace", "Integration traffic"],
        feature_policies: ["Team collaboration defaults"],
        best_practices: ["Granular controls", "Export support"],
        bad_practices: ["Broad workspace surface"],
        raw_points: [
          "Workspace content is stored centrally",
          "Integrations can extend sharing",
        ],
      },
    },
  },
  {
    slug: "discord",
    name: "Discord",
    type: "WEB",
    location: "https://discord.com",
    description:
      "Communications platform with a broad telemetry surface and extensive social graph data.",
    status: "ACTIVE",
    urls: {
      home: "https://discord.com",
      privacy: "https://discord.com/privacy",
    },
    analysis: {
      quickTake:
        "Discord is feature-rich, but it collects more behavioral and social data than privacy-first alternatives.",
      verdict: "Use with caution",
      riskScore: 78,
      redFlags: ["Large social graph collection", "Usage and device telemetry"],
      yellowFlags: ["Broad moderation and personalization signals"],
      greenFlags: ["Privacy settings exist", "User controls for some data"],
      whatMatters: [
        "Chats, communities, and metadata all matter",
        "Social graph is part of the product",
      ],
      dataFlow: ["Cloud-hosted messaging", "Telemetry and moderation systems"],
      featurePolicies: [
        "Community moderation tools",
        "Status and activity features",
      ],
      bestPractices: ["Account controls", "Notification controls"],
      badPractices: ["Broad telemetry", "Rich social profiling"],
    },
    run: {
      id: "run-discord",
      status: "DONE",
      stage1: {
        main_points: [
          "Collects social graph and usage data",
          "Messaging is cloud-hosted",
        ],
      },
      stage2: {
        quick_take:
          "The service is convenient, but it ties together social and behavioral signals.",
        what_matters: ["Social graph", "Telemetry"],
        flags: ["Broad data collection"],
        verdict: "High risk",
        data_flow: ["Messaging cloud", "Telemetry systems"],
        feature_policies: ["Moderation and personalization"],
      },
      stage3: {
        red_flags: ["Large social graph collection", "Usage telemetry"],
        yellow_flags: ["Broad personalization signals"],
        green_flags: ["Some privacy controls available"],
        best_practices: ["Account controls"],
        bad_practices: ["Rich profiling", "Broad telemetry"],
        risk_score: 78,
      },
      final: {
        quick_take:
          "Discord offers strong community features, but the privacy cost is higher because of the depth of usage and social data it collects.",
        verdict: "High risk",
        flags: {
          red: ["Large social graph collection", "Usage telemetry"],
          yellow: ["Broad personalization signals"],
          green: ["Some privacy controls available"],
        },
        risk_score: 78,
        what_matters: ["Social graph", "Telemetry", "Community history"],
        data_flow: ["Cloud messaging", "Moderation systems"],
        feature_policies: ["Status and activity features"],
        best_practices: ["Account controls"],
        bad_practices: ["Rich profiling", "Broad telemetry"],
        raw_points: [
          "Collects social graph and usage data",
          "Messaging is cloud-hosted",
        ],
      },
    },
  },
  {
    slug: "warp",
    name: "Warp",
    type: "CLI",
    location: "https://warp.dev",
    description: "Terminal product under review, with an analysis job queued.",
    status: "PROCESSING",
    urls: {
      home: "https://warp.dev",
      privacy: "https://warp.dev/privacy",
    },
    run: {
      id: "run-warp",
      status: "PROCESSING",
      stage1: {
        main_points: ["Queued for extraction"],
      },
      stage2: null,
      stage3: null,
      final: null,
    },
  },
  {
    slug: "raycast",
    name: "Raycast",
    type: "UTIL",
    location: "https://raycast.com",
    description: "Productivity app waiting in the review queue.",
    status: "PRE_REVIEWED",
    urls: {
      home: "https://www.raycast.com",
      privacy: "https://www.raycast.com/privacy",
    },
    run: {
      id: "run-raycast",
      status: "PENDING",
      stage1: null,
      stage2: null,
      stage3: null,
      final: null,
    },
  },
] as const;

async function seedSoftware() {
  for (const item of softwares) {
    const software = await prisma.software.upsert({
      where: { slug: item.slug },
      create: {
        name: item.name,
        type: item.type,
        slug: item.slug,
        location: item.location,
        description: item.description,
        logoUrl: null,
        urls: item.urls,
        status: item.status,
      },
      update: {
        name: item.name,
        type: item.type,
        location: item.location,
        description: item.description,
        logoUrl: null,
        urls: item.urls,
        status: item.status,
      },
    });

    if (item.analysis) {
      await prisma.analysis.upsert({
        where: { softwareId: software.id },
        create: {
          softwareId: software.id,
          quickTake: item.analysis.quickTake,
          verdict: item.analysis.verdict,
          riskScore: item.analysis.riskScore,
          redFlags: item.analysis.redFlags,
          yellowFlags: item.analysis.yellowFlags,
          greenFlags: item.analysis.greenFlags,
          whatMatters: item.analysis.whatMatters,
          dataFlow: item.analysis.dataFlow,
          featurePolicies: item.analysis.featurePolicies,
          bestPractices: item.analysis.bestPractices,
          badPractices: item.analysis.badPractices,
          reviewed: true,
          version: "seed",
          generatedAt: new Date(),
        },
        update: {
          quickTake: item.analysis.quickTake,
          verdict: item.analysis.verdict,
          riskScore: item.analysis.riskScore,
          redFlags: item.analysis.redFlags,
          yellowFlags: item.analysis.yellowFlags,
          greenFlags: item.analysis.greenFlags,
          whatMatters: item.analysis.whatMatters,
          dataFlow: item.analysis.dataFlow,
          featurePolicies: item.analysis.featurePolicies,
          bestPractices: item.analysis.bestPractices,
          badPractices: item.analysis.badPractices,
          reviewed: true,
          version: "seed",
          generatedAt: new Date(),
        },
      });
    }

    if (item.run) {
      await prisma.run.upsert({
        where: { id: item.run.id },
        create: {
          id: item.run.id,
          softwareId: software.id,
          status: item.run.status,
          stage1: item.run.stage1 ?? undefined,
          stage2: item.run.stage2 ?? undefined,
          stage3: item.run.stage3 ?? undefined,
          final: item.run.final ?? undefined,
          startedAt: item.run.status !== "PENDING" ? new Date() : null,
          finishedAt: item.run.status === "DONE" ? new Date() : null,
        },
        update: {
          softwareId: software.id,
          status: item.run.status,
          stage1: item.run.stage1 ?? undefined,
          stage2: item.run.stage2 ?? undefined,
          stage3: item.run.stage3 ?? undefined,
          final: item.run.final ?? undefined,
          startedAt: item.run.status !== "PENDING" ? new Date() : null,
          finishedAt: item.run.status === "DONE" ? new Date() : null,
        },
      });
    }
  }
}

async function main() {
  await seedSoftware();
  console.log(`Seeded ${softwares.length} software entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
