import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
