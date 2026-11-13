import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "CampusWay — Campus Navigation & Wayfinding",
  description:
    "Helping university students, staff, and visitors navigate campus buildings, gates, lecture halls, and landmarks.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#F7F3EC] text-[#111111] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
