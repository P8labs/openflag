import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  SOFTWARE_RISK_BANDS,
  type RiskBandKey,
  type SoftwareStatusValue,
  type SoftwareTypeValue,
} from "@/lib/software-meta";

export {
  SOFTWARE_RISK_BANDS,
  SOFTWARE_STATUSES,
  SOFTWARE_TYPES,
  slugify,
} from "@/lib/software-meta";
export type {
  RiskBandKey,
  SoftwareStatusValue,
  SoftwareTypeValue,
} from "@/lib/software-meta";

export type SoftwareCardRecord = Prisma.SoftwareGetPayload<{
  include: {
    analysis: {
      select: {
        riskScore: true;
        verdict: true;
      };
    };
  };
}>;

export type SoftwareDetailRecord = Prisma.SoftwareGetPayload<{
  include: {
    analysis: true;
    runs: {
      orderBy: {
        createdAt: "desc";
      };
      take: 1;
    };
  };
}>;

export type SoftwareAdminRecord = Prisma.SoftwareGetPayload<{
  include: {
    analysis: {
      select: {
        riskScore: true;
        verdict: true;
      };
    };
    runs: {
      orderBy: {
        createdAt: "desc";
      };
      take: 1;
    };
  };
}>;

export type SoftwareCreateInput = {
  name: string;
  type: SoftwareTypeValue;
  slug: string;
  location: string;
  description?: string | null;
  logoUrl?: string | null;
  urls: Record<string, string>;
};

export type SoftwareUpdateInput = SoftwareCreateInput & {
  status: SoftwareStatusValue;
};

export type SoftwareSuggestionInput = Pick<
  SoftwareCreateInput,
  "name" | "type" | "slug" | "urls" | "description"
>;

export function normalizeUrlsInput(input: string) {
  if (!input.trim()) {
    throw new Error("urls are required");
  }

  const parsed = JSON.parse(input) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("urls must be a JSON object");
  }

  const entries = Object.entries(parsed as Record<string, unknown>);

  if (entries.length === 0) {
    throw new Error("urls must include at least one entry");
  }

  const normalized: Record<string, string> = {};

  for (const [key, value] of entries) {
    if (typeof key !== "string" || !key.trim()) {
      throw new Error("urls keys must be non-empty strings");
    }

    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`urls.${key} must be a string URL`);
    }

    normalized[key.trim()] = value.trim();
  }

  return normalized;
}

export function buildSoftwareWhere(args: {
  status?: SoftwareStatusValue | null;
  type?: SoftwareTypeValue | null;
  search?: string | null;
  riskBand?: RiskBandKey | null;
}) {
  const { status, type, search, riskBand } = args;
  const andConditions: Prisma.SoftwareWhereInput[] = [];

  if (status) {
    andConditions.push({ status });
  }

  if (type) {
    andConditions.push({ type });
  }

  if (search?.trim()) {
    const searchTerm = search.trim();

    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { slug: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (riskBand) {
    const band = SOFTWARE_RISK_BANDS.find(
      (candidate) => candidate.key === riskBand,
    );

    if (band) {
      andConditions.push({
        analysis: {
          is: {
            riskScore: {
              gte: band.min,
              lte: band.max,
            },
          },
        },
      });
    }
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

export async function getLandingSoftware(): Promise<SoftwareCardRecord[]> {
  return prisma.software.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      analysis: {
        select: {
          riskScore: true,
          verdict: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 12,
  });
}

export async function getExploreSoftware(args: {
  search?: string | null;
  type?: SoftwareTypeValue | null;
  riskBand?: RiskBandKey | null;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: SoftwareCardRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(24, Math.max(6, args.pageSize ?? 12));

  const where = buildSoftwareWhere({
    status: "ACTIVE",
    type: args.type,
    search: args.search,
    riskBand: args.riskBand,
  });

  const [items, totalCount] = await prisma.$transaction([
    prisma.software.findMany({
      where,
      include: {
        analysis: {
          select: {
            riskScore: true,
            verdict: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.software.count({ where }),
  ]);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getAdminSoftwarePage(args: {
  search?: string | null;
  status?: SoftwareStatusValue | null;
  type?: SoftwareTypeValue | null;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: SoftwareAdminRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(25, Math.max(8, args.pageSize ?? 10));

  const where: Prisma.SoftwareWhereInput = {
    ...buildSoftwareWhere({
      status: args.status,
      type: args.type,
      search: args.search,
    }),
  };

  const [items, totalCount] = await prisma.$transaction([
    prisma.software.findMany({
      where,
      include: {
        analysis: {
          select: {
            riskScore: true,
            verdict: true,
          },
        },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.software.count({ where }),
  ]);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getSoftwareBySlug(
  slug: string,
): Promise<SoftwareDetailRecord | null> {
  return prisma.software.findUnique({
    where: { slug },
    include: {
      analysis: true,
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getSoftwareById(
  id: string,
): Promise<SoftwareDetailRecord | null> {
  return prisma.software.findUnique({
    where: { id },
    include: {
      analysis: true,
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function createSoftwareWithRun(input: SoftwareCreateInput) {
  return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    const software = await transaction.software.create({
      data: {
        name: input.name,
        type: input.type,
        slug: input.slug,
        location: input.location,
        description: input.description ?? null,
        logoUrl: input.logoUrl ?? null,
        urls: input.urls,
        status: "PRE_REVIEWED",
      },
    });

    const run = await transaction.run.create({
      data: {
        softwareId: software.id,
        status: "PENDING",
      },
    });

    return { software, run };
  });
}

export async function createSuggestion(input: SoftwareSuggestionInput) {
  return prisma.software.create({
    data: {
      name: input.name,
      type: input.type,
      slug: input.slug,
      description: input.description ?? null,
      location: Object.values(input.urls)[0] ?? input.slug,
      logoUrl: null,
      urls: input.urls,
      status: "PRE_REVIEWED",
    },
  });
}

export async function updateSoftwareRecord(
  id: string,
  input: SoftwareUpdateInput,
) {
  return prisma.software.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      slug: input.slug,
      location: input.location,
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      urls: input.urls,
      status: input.status,
    },
  });
}

export async function updateSoftwareStatus(
  id: string,
  status: SoftwareStatusValue,
) {
  return prisma.software.update({
    where: { id },
    data: { status },
  });
}

export async function getSoftwareProgressBySlug(
  slug: string,
): Promise<SoftwareDetailRecord | null> {
  return prisma.software.findUnique({
    where: { slug },
    include: {
      analysis: true,
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getSoftwareProgressById(
  id: string,
): Promise<SoftwareDetailRecord | null> {
  return prisma.software.findUnique({
    where: { id },
    include: {
      analysis: true,
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getRunById(id: string): Promise<Prisma.RunModel | null> {
  return prisma.run.findUnique({
    where: { id },
  });
}

export async function updateRunStage(
  runId: string,
  stage: "stage1" | "stage2" | "stage3" | "final",
  payload: Prisma.InputJsonValue,
) {
  const data: Prisma.RunUpdateInput = {
    status: "PROCESSING",
  };

  if (stage === "stage1") {
    data.stage1 = payload;
  }

  if (stage === "stage2") {
    data.stage2 = payload;
  }

  if (stage === "stage3") {
    data.stage3 = payload;
  }

  if (stage === "final") {
    data.final = payload;
  }

  return prisma.run.update({
    where: { id: runId },
    data,
  });
}

export async function completeRun(runId: string) {
  return prisma.run.update({
    where: { id: runId },
    data: {
      status: "DONE",
      finishedAt: new Date(),
    },
  });
}
