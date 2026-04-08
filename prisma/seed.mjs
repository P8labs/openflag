import generatedPrisma from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient, SwipeDirection, MatchType } = generatedPrisma;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  const users = [
    {
      id: "demo-arya",
      name: "Arya Stone",
      email: "arya@openflag.xyz",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces",
      username: "arya-stone",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces",
      bio: "Frontend builder with a soft spot for useful tooling.",
      skills: ["TypeScript", "React", "Prisma", "Design Systems"],
      interests: ["Open source", "B2B", "Developer tools"],
      availability: "8 hrs/week evenings",
    },
    {
      id: "demo-noah",
      name: "Noah Patel",
      email: "noah@openflag.xyz",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
      username: "noah-patel",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
      bio: "Systems engineer who likes fast feedback loops.",
      skills: ["Rust", "Postgres", "Performance", "APIs"],
      interests: ["Infra", "AI tools", "Shipping"],
      availability: "12 hrs/week",
    },
    {
      id: "demo-zoe",
      name: "Zoe Kim",
      email: "zoe@openflag.xyz",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces",
      username: "zoe-kim",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces",
      bio: "Product-minded motion designer building polished interfaces.",
      skills: ["Motion", "UX", "Figma", "Brand"],
      interests: ["Startups", "Creative tools", "Community"],
      availability: "6 hrs/week",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        image: user.image,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });

    await prisma.profileMeta.upsert({
      where: { userId: user.id },
      update: {
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        interests: user.interests,
        availability: user.availability,
        onboardingComplete: true,
        recentActivityAt: new Date(),
      },
      create: {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        interests: user.interests,
        availability: user.availability,
        onboardingComplete: true,
        recentActivityAt: new Date(),
      },
    });
  }

  const projects = [
    {
      id: "project-signal-board",
      ownerId: "demo-noah",
      title: "Signal Board",
      description:
        "A lightweight analytics cockpit for founder updates and team visibility.",
      requiredRoles: ["TypeScript", "UI", "Data Viz"],
      tags: ["SaaS", "B2B", "Dashboards"],
      recentActivityAt: daysAgo(1),
    },
    {
      id: "project-lagoon-notes",
      ownerId: "demo-arya",
      title: "Lagoon Notes",
      description:
        "A collaboration workspace for async product research and decision logs.",
      requiredRoles: ["React", "Product Design", "Writing"],
      tags: ["Knowledge base", "Research", "Docs"],
      recentActivityAt: daysAgo(3),
    },
    {
      id: "project-motion-kit",
      ownerId: "demo-zoe",
      title: "Motion Kit",
      description:
        "Reusable motion primitives for polished onboarding and dashboards.",
      requiredRoles: ["Motion", "Frontend", "Accessibility"],
      tags: ["Design systems", "Component library"],
      recentActivityAt: daysAgo(6),
    },
    {
      id: "project-ship-lane",
      ownerId: "demo-noah",
      title: "Ship Lane",
      description:
        "A developer-first planning surface for a focused release train.",
      requiredRoles: ["Prisma", "APIs", "Infrastructure"],
      tags: ["Developer tools", "Workflow"],
      recentActivityAt: daysAgo(2),
    },
    {
      id: "project-vector-hub",
      ownerId: "demo-arya",
      title: "Vector Hub",
      description:
        "A compact collaboration hub for product teams managing research, feedback, and shipping notes.",
      requiredRoles: ["Next.js", "UX", "Content Design"],
      tags: ["Product", "Collaboration", "B2B"],
      recentActivityAt: daysAgo(0),
    },
    {
      id: "project-rift-lab",
      ownerId: "demo-noah",
      title: "Rift Lab",
      description:
        "An experiment tracker for shipping AI-powered features with reviewable outcomes.",
      requiredRoles: ["AI", "Backend", "Evaluation"],
      tags: ["AI tools", "Experiments", "Analytics"],
      recentActivityAt: daysAgo(4),
    },
    {
      id: "project-studio-stack",
      ownerId: "demo-zoe",
      title: "Studio Stack",
      description:
        "A branded component workspace for founders who need a fast design system to ship with.",
      requiredRoles: ["Design Systems", "Frontend", "Motion"],
      tags: ["Brand", "UI", "Creator tools"],
      recentActivityAt: daysAgo(1),
    },
    {
      id: "project-sprint-canvas",
      ownerId: "demo-arya",
      title: "Sprint Canvas",
      description:
        "A planning surface for small teams that want to keep scope sharp and milestones visible.",
      requiredRoles: ["Product", "Planning", "Docs"],
      tags: ["Workflow", "Roadmap", "Teams"],
      recentActivityAt: daysAgo(5),
    },
    {
      id: "project-quiet-stack",
      ownerId: "demo-noah",
      title: "Quiet Stack",
      description:
        "A thoughtful collection of engineering patterns for teams that care about speed and clarity.",
      requiredRoles: ["Infrastructure", "APIs", "Reliability"],
      tags: ["DevEx", "Ops", "Platform"],
      recentActivityAt: daysAgo(2),
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        ownerId: project.ownerId,
        title: project.title,
        description: project.description,
        requiredRoles: project.requiredRoles,
        tags: project.tags,
        isActive: true,
        recentActivityAt: project.recentActivityAt,
      },
      create: {
        id: project.id,
        ownerId: project.ownerId,
        title: project.title,
        description: project.description,
        requiredRoles: project.requiredRoles,
        tags: project.tags,
        isActive: true,
        recentActivityAt: project.recentActivityAt,
      },
    });
  }

  await prisma.swipe.upsert({
    where: {
      swiperId_targetUserId: {
        swiperId: "demo-arya",
        targetUserId: "demo-noah",
      },
    },
    update: { direction: SwipeDirection.RIGHT },
    create: {
      swiperId: "demo-arya",
      targetUserId: "demo-noah",
      direction: SwipeDirection.RIGHT,
    },
  });

  await prisma.swipe.upsert({
    where: {
      swiperId_targetUserId: {
        swiperId: "demo-noah",
        targetUserId: "demo-arya",
      },
    },
    update: { direction: SwipeDirection.RIGHT },
    create: {
      swiperId: "demo-noah",
      targetUserId: "demo-arya",
      direction: SwipeDirection.RIGHT,
    },
  });

  await prisma.match.upsert({
    where: {
      type_userAId_userBId: {
        type: MatchType.USER_USER,
        userAId: "demo-arya",
        userBId: "demo-noah",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      type: MatchType.USER_USER,
      status: "ACTIVE",
      userAId: "demo-arya",
      userBId: "demo-noah",
    },
  });

  await prisma.match.upsert({
    where: {
      type_interestedUserId_projectId: {
        type: MatchType.USER_PROJECT,
        interestedUserId: "demo-zoe",
        projectId: "project-lagoon-notes",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      type: MatchType.USER_PROJECT,
      status: "ACTIVE",
      interestedUserId: "demo-zoe",
      projectId: "project-lagoon-notes",
      projectOwnerId: "demo-arya",
    },
  });

  console.log("Seeded demo users, projects, swipes, and matches.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
