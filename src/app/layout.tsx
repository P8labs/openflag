import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { isManifestoMode } from "@/lib/site-mode";
import { ManifestoPage } from "@/components/manifesto-page";
import CoreShell from "@/components/core/shell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Openflag",
  description: "Discover builders and projects through proof of work.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  const profile = session
    ? await prisma.profileMeta.findUnique({
        where: { userId: session.user.id },
        select: {
          username: true,
          avatar: true,
          onboardingComplete: true,
        },
      })
    : null;

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", ibmPlexSans.variable)}
    >
      <body className="min-h-full">
        <Providers
          initialViewer={{
            session: session
              ? {
                  user: {
                    id: session.user.id,
                    name: session.user.name,
                    image: session.user.image ?? null,
                    email: session.user.email,
                  },
                }
              : null,
            profile,
          }}
        >
          {isManifestoMode ? (
            <ManifestoPage />
          ) : (
            <CoreShell>{children}</CoreShell>
          )}
        </Providers>
      </body>
    </html>
  );
}
