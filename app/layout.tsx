import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZenPro — Your Daily Intelligence Companion",
  description:
    "ZenPro is a personalized intelligence operating system that helps ambitious people understand what matters, discover opportunities, learn continuously, and stay ahead — without information overload.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000"),
  openGraph: {
    type: "website",
    title: "ZenPro — Your Daily Intelligence Companion",
    description: "Personalized intelligence for ambitious people.",
    siteName: "ZenPro",
  },
  twitter: {
    card: "summary",
    title: "ZenPro — Your Daily Intelligence Companion",
    description:
      "Personalized intelligence for technology, careers, learning, opportunities, and emerging trends.",
  },
  keywords: [
    "technology intelligence",
    "career opportunities",
    "learning resources",
    "developer tools",
    "tech trends",
  ],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
