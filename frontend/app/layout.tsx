import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusWay | Campus Navigation & Wayfinding",
  description: "Next-generation campus navigation, route planning, and visitor assistance system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
