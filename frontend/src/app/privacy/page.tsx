"use client";

import React from "react";
import Link from "next/link";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { EditorialFooter } from "@/components/home/EditorialFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#111111] selection:bg-[#E8542F] selection:text-white flex flex-col font-sans">
      <EditorialNavbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
        {/* Header Block */}
        <div className="space-y-4 border-b border-[#111111]/12 pb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">LEGAL ARCHITECTURE</span>
            <span>&bull;</span>
            <span>UPDATED NOVEMBER 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#111111] font-display">
            Privacy <span className="italic text-[#E8542F]">Policy</span>
          </h1>

          <p className="text-base sm:text-lg text-[#5B5750] max-w-2xl font-sans leading-relaxed">
            CampusWay is engineered around privacy-first navigation principles: zero mandatory logins, client-side route computation, and strict minimization of telemetric data.
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Quick Table of Contents Sticky Column */}
          <aside className="md:col-span-4 space-y-4">
            <div className="sticky top-28 p-5 rounded-2xl bg-white border border-[#E1DDD3] shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Sections Summary
              </span>
              <nav className="flex flex-col space-y-2 text-xs font-mono text-[#5B5750]">
                <a href="#zero-login" className="hover:text-[#E8542F] transition-colors">
                  01. Zero-Login &amp; Guest Data
                </a>
                <a href="#data-collection" className="hover:text-[#E8542F] transition-colors">
                  02. Telemetry &amp; Geolocation
                </a>
                <a href="#accounts" className="hover:text-[#E8542F] transition-colors">
                  03. Registered Accounts
                </a>
                <a href="#third-parties" className="hover:text-[#E8542F] transition-colors">
                  04. Third-Party Services
                </a>
                <a href="#rights" className="hover:text-[#E8542F] transition-colors">
                  05. User Rights &amp; Erasure
                </a>
              </nav>
            </div>
          </aside>

          {/* Legal Prose Content */}
          <article className="md:col-span-8 space-y-10 text-sm leading-relaxed text-[#2B2925] font-sans">
            <section id="zero-login" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  01. Zero-Login &amp; Guest Experience
                </span>
              </div>
              <p>
                CampusWay is designed to operate completely without requiring authentication. When using the platform as a guest, your saved buildings, route preferences, and accessible corridor selections are stored strictly on your local device via standard browser storage (<code className="font-mono text-xs bg-black/05 px-1 py-0.5 rounded">localStorage</code>). No personal identifiers or guest session profiles are recorded on our backend database.
              </p>
            </section>

            <section id="data-collection" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  02. Telemetry &amp; Campus Geolocation
                </span>
              </div>
              <p>
                CampusWay does not engage in continuous GPS background tracking. When you interact with the interactive map or request a route:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#5B5750]">
                <li>Wayfinding algorithms calculate paths between topological graph nodes on demand.</li>
                <li>Temporary device location coordinates (if permitted by your browser) are processed in volatile memory only to resolve your nearest building node.</li>
                <li>No location breadcrumbs or travel history logs are saved to central servers.</li>
              </ul>
            </section>

            <section id="accounts" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  03. Registered User Accounts
                </span>
              </div>
              <p>
                If you choose to create a registered account (e.g., to synchronize saved bookmarks across multiple devices), we collect minimal identity attributes: your name, verified university email address, and an Argon2id cryptographically hashed password. Session cookies are delivered with <code className="font-mono text-xs bg-black/05 px-1 py-0.5 rounded">HttpOnly</code>, <code className="font-mono text-xs bg-black/05 px-1 py-0.5 rounded">SameSite=Lax</code> flags to prevent cross-site scripting exposure.
              </p>
            </section>

            <section id="third-parties" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  04. Third-Party Integrations &amp; Map Data
                </span>
              </div>
              <p>
                Campus geometry and building outlines are derived from OpenStreetMap contributors under the Open Database License (ODbL). Optional Google Sign-In integrates with Google OAuth 2.0 without granting CampusWay access to your emails, Google Drive, or calendar events.
              </p>
            </section>

            <section id="rights" className="space-y-3 scroll-mt-28 border-t border-[#111111]/10 pt-6">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  05. Account Erasure &amp; Contact
                </span>
              </div>
              <p>
                You may request complete erasure of your account, synced bookmarks, and session records at any time. For questions regarding this policy or system architecture, reach out via the <Link href="/explore" className="text-[#E8542F] font-bold underline">Help &amp; Feedback channel</Link> or the <Link href="/about" className="text-[#E8542F] font-bold underline">developer profile</Link>.
              </p>
            </section>
          </article>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

