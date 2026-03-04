import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/layout/ClientProviders";

export const metadata: Metadata = {
  title: "StreamsAI — AI Content Generation Platform",
  description: "Create stunning videos, images, voiceovers, and scripts with AI. One platform, unlimited creativity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
