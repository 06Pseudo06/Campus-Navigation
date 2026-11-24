import React from "react";
import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export const metadata: Metadata = {
  title: "CampusWay Admin | Administrative Operations Console",
  description: "Secure operational control center for Lovely Professional University navigation graph, users, locations, and system telemetry.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div
        className="min-h-screen flex flex-row w-full selection:bg-[#E8452C]/20 selection:text-[#E8452C]"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text)",
        }}
      >
        {/* Left Administrative Navigation */}
        <AdminSidebar />

        {/* Primary Viewport Area */}
        <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-hidden">
          {/* Top Breadcrumb & User Toolbar */}
          <AdminTopBar />

          {/* Scrollable Content Workspace */}
          <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 print:p-0 print:overflow-visible">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
