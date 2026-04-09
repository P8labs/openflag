import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { isManifestoMode } from "@/lib/site-mode";
import { ManifestoPage } from "@/components/manifesto-page";
import CoreShell from "@/components/core/shell";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Openflag",
  description: "Discover builders and projects through proof of work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "dark", geistSans.variable, geistMono.variable, "font-sans", ibmPlexSans.variable)}
    >
      <body className="min-h-full">
        <Providers>
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
