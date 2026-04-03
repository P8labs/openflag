import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://openflag.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "OpenFlag",
    template: "%s • OpenFlag",
  },

  description:
    "Understand privacy policies and terms in simple way. Know what you agree to before clicking accept.",

  keywords: [
    "privacy policy",
    "terms of service",
    "ai summary",
    "data privacy",
    "openflag",
  ],

  openGraph: {
    title: "OpenFlag",
    description:
      "Stop accepting terms you don’t understand. Get clear insights, risks, and summaries.",
    url: BASE_URL,
    siteName: "OpenFlag",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "OpenFlag",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "OpenFlag",
    description:
      "Know what you agree to. Simple breakdown of privacy policies.",
    images: ["/og.png"],
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
