import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { seedProfileFromAuth } from "./github-sync";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["read:user", "user:email", "public_repo"],
      overrideUserInfoOnSignIn: true,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      overrideUserInfoOnSignIn: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          try {
            await seedProfileFromAuth({
              userId: user.id,
              headers: context?.headers,
            });
          } catch (error) {
            console.log("[ONBOARD GITHUB] :?", error);
          }
        },
      },
    },
  },

  plugins: [nextCookies()],
});
