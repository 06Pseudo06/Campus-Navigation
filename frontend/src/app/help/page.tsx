"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { EditorialFooter } from "@/components/home/EditorialFooter";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { useAuth } from "@/context/AuthContext";
import { assistanceService } from "@/services/assistanceService";
import { AssistanceRequestRead, AssistanceType } from "@/types/api";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";
import {
  HelpCircleIcon,
  CheckCircleIcon,
  CompassIcon,
  AccessibilityIcon,
  RouteIcon,
} from "@/components/dashboard/DashboardIcons";
import { Spinner } from "@/components/icons/Icons";

export default function HelpPage() {
  const { user } = useAuth();

  // Assistance form state
  const [assistanceType, setAssistanceType] = useState<AssistanceType>("lost");
  const [requesterName, setRequesterName] = useState<string>(
    user?.name || (user?.email ? user.email.split("@")[0] : "")
  );
  const [contactPhone, setContactPhone] = useState<string>("");
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Submission lifecycle
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<AssistanceRequestRead | null>(null);

  // Active FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!description.trim() && !contactPhone.trim() && !targetLocationId) {
      setSubmitError(
        "Please provide an issue description, a contact phone number, or select a target location."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await assistanceService.submitAssistanceRequest({
        assistance_type: assistanceType,
        requester_name: requesterName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        target_location_id: targetLocationId ? targetLocationId : undefined,
        description: description.trim() || undefined,
      });

      setSubmittedTicket(ticket);
      setDescription("");
      setTargetLocationId("");
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit assistance request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setSubmitError(null);
  };

  const campusSupportDirectory = [
    {
      label: "Campus Safety & Security Operations",
      facility: "Main Gate 1 Security Kiosk",
      hours: "24/7 Dispatch",
      phone: "+91 1824 517000",
    },
    {
      label: "Student Health & Wellness / Hospital",
      facility: "Shanti Devi Mittal Hospital",
      hours: "24/7 Emergency Care",
      phone: "+91 1824 517108",
    },
    {
      label: "Disability & Step-Free Accessibility Support",
      facility: "Central Spine & Admin Block 34",
      hours: "Mon–Fri, 8:30–17:00",
      phone: "+91 1824 517050",
    },
    {
      label: "Campus Information & Visitor Welcome Desk",
      facility: "Uni-Mall Ground Floor Atrium",
      hours: "Daily, 8:00–20:00",
      phone: "+91 1824 517111",
    },
  ];

  const faqs = [
    {
      q: "How do I find a specific lecture hall, lab, or academic block?",
      a: "Open the Explore tab and use the top search bar. Type the block number (e.g., 'Block 34' or 'Block 1') or department name to highlight the building footprint on the map. Click 'Directions Here' to compute the shortest walking path.",
    },
    {
      q: "How do I calculate wheelchair-accessible or step-free routes?",
      a: "In the directions panel on the Explore page, click the 'Step-Free' / 'Accessible' button. The routing engine dynamically filters out staircases, curbs, and steep inclines to generate level path corridors.",
    },
    {
      q: "Where is visitor parking located on campus?",
      a: "Designated visitor parking is situated adjacent to Main Gate 1 and the Uni-Mall perimeter. Follow campus directional signboards or search 'Visitor Parking' in CampusWay for exact coordinates.",
    },
    {
      q: "How do QR signs work with CampusWay?",
      a: "CampusWay QR codes are placed on physical signboards and building entrance pillars. Scanning a QR sign with your smartphone camera or the in-app scanner opens CampusWay and instantly snaps your origin to that kiosk.",
    },
    {
      q: "Is my personal GPS location tracked or saved on your servers?",
      a: "No. CampusWay features a zero-server-tracking client architecture. Your raw GPS latitude and longitude are processed entirely in your device's browser memory. Only verified topological node identifiers are sent to calculate routes.",
    },
    {
      q: "What should I do in case of an on-campus medical or safety emergency?",
      a: "Immediately contact Campus Security at +91 1824 517000 or activate the nearest blue beacon call station stationed along the main campus spine walkways.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#F6F4EF] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 overflow-x-hidden selection:bg-[#E8452C] selection:text-white transition-colors duration-200">
      <CustomCursor />

      {/* Sitewide Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8452C]/10 border border-[#E8452C]/30 text-xs font-semibold text-[#E8452C] font-mono">
            <HelpCircleIcon className="w-3.5 h-3.5" />
            <span>VISITOR &amp; CAMPUS ASSISTANCE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white leading-[1.0] font-display">
            Help &amp; Navigation Support
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
            Guidance for first-time visitors, students, and accessibility requests across Lovely Professional University. Find emergency desks, submit assistance tickets, or inspect common wayfinding questions.
          </p>

          {/* Quick Jump Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href="#assistance-form"
              className="px-4 py-2 rounded-xl bg-[#E8452C] hover:bg-[#d03d27] text-white text-xs font-semibold font-mono transition-colors shadow-xs"
            >
              Request Live Assistance ↓
            </a>
            <a
              href="#support-directory"
              className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-[#0E1118] dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 text-xs font-semibold font-mono transition-colors shadow-xs"
            >
              Support Directory ↓
            </a>
            <a
              href="#faqs"
              className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-[#0E1118] dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 text-xs font-semibold font-mono transition-colors shadow-xs"
            >
              FAQs ↓
            </a>
            <Link
              href="/explore"
              className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-300 text-xs font-semibold font-mono transition-colors"
            >
              Campus Map →
            </Link>
          </div>
        </div>
      </section>

      {/* Main Grid: Live Assistance Request Form & Status Card */}
      <section id="assistance-form" className="py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-10 shadow-sm dark:shadow-xl space-y-8">
          <div className="border-b border-slate-100 dark:border-zinc-800 pb-5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
              <span className="text-[#E8452C]">01 /</span>
              <span>LIVE ASSISTANCE DISPATCH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display mt-1">
              Request Navigation Assistance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Need on-campus physical guidance, wheelchair escort, or lost navigation support? Submit a direct dispatch request.
            </p>
          </div>

          {/* Form or Ticket Confirmation */}
          {submittedTicket ? (
            <div
              data-testid="assistance-ticket-card"
              className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold">Assistance Request Submitted</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-bold uppercase">
                  Status: {submittedTicket.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Your request has been logged and assigned to <b>{submittedTicket.assigned_to || "Campus Operations"}</b>. An on-duty campus wayfinding assistant has been notified.
              </p>

              <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-emerald-200 dark:border-emerald-800 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">TICKET REF:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{submittedTicket.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">TYPE:</span>
                  <span className="capitalize font-bold text-slate-900 dark:text-white">
                    {submittedTicket.assistance_type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">REQUESTER:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {submittedTicket.requester_name || "Visitor"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
                  {submitError}
                </div>
              )}

              {/* Assistance Type Segmented Options */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                  Assistance Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "lost", title: "Lost on Campus", icon: CompassIcon },
                    { id: "mobility_support", title: "Step-Free Escort", icon: AccessibilityIcon },
                    { id: "medical", title: "Medical / First Aid", icon: HelpCircleIcon },
                    { id: "general_inquiry", title: "General Inquiry", icon: RouteIcon },
                  ].map((cat) => {
                    const isSelected = assistanceType === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setAssistanceType(cat.id)}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#E8452C]/10 border-[#E8452C] text-[#E8452C] font-bold shadow-xs"
                            : "bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{cat.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="requester-name"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    id="requester-name"
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="e.g. Gurpreet Singh"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-phone"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono"
                  >
                    Contact Mobile Number
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor="target-location"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono"
                  >
                    Target Location or Nearest Building
                  </label>
                  <select
                    id="target-location"
                    value={targetLocationId}
                    onChange={(e) => setTargetLocationId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                  >
                    <option value="">Select campus destination (optional)...</option>
                    {VERIFIED_DATASET_C_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.slug || loc.id}>
                        {loc.name} ({loc.location_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor="issue-description"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono"
                  >
                    Issue or Wayfinding Details
                  </label>
                  <textarea
                    id="issue-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Need assistance locating Room 34-201 or wheelchair ramp access near Block 8."
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="submit-assistance-btn"
                className="px-6 py-3 rounded-xl bg-[#E8452C] hover:bg-[#d03d27] disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#E8452C]/20"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    <span>Dispatching Request...</span>
                  </>
                ) : (
                  <span>Submit Assistance Request &rarr;</span>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* SECTION 2: ON-CAMPUS SERVICE DESKS DIRECTORY */}
      <section id="support-directory" className="py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
            <span className="text-[#E8452C]">02 /</span>
            <span>CAMPUS DESKS &amp; SERVICES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
            On-Campus Help Desks &amp; Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campusSupportDirectory.map((desk, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{desk.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{desk.facility}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 shrink-0">
                  {desk.hours}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Direct Helpline:</span>
                <a
                  href={`tel:${desk.phone.replace(/[^0-9+]/g, "")}`}
                  className="text-xs font-mono font-bold text-[#E8452C] hover:underline"
                >
                  {desk.phone}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: EMERGENCY BLUE LIGHT STATIONS */}
      <section className="py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-slate-900/10 border border-blue-500/30 space-y-3">
          <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-400">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping inline-block" />
            <h3 className="text-base font-bold uppercase tracking-wider font-mono">
              Blue Light Emergency Call Stations
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
            Throughout LPU main promenades, Central Spine, and residential blocks, prominent emergency towers marked with blue beacon lights connect directly to Campus Security Dispatch at the push of a red button.
          </p>
        </div>
      </section>

      {/* SECTION 4: FREQUENTLY ASKED QUESTIONS */}
      <section id="faqs" className="py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
            <span className="text-[#E8452C]">03 /</span>
            <span>INFORMATIONAL GUIDE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E8452C] shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: CTA FOOTER BAND */}
      <section className="relative py-20 bg-gradient-to-b from-[#151B28] to-[#0F141F] text-white text-center mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <span className="text-xs font-mono text-[#E8452C] font-bold tracking-widest uppercase">
            READY TO EXPLORE CAMPUS?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display">
            Navigate with CampusWay
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Experience real-time graph routing, step-free corridors, and architectural wayfinding across your campus.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/explore"
              className="px-6 py-3 rounded-full bg-[#E8452C] hover:bg-[#d03d27] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg"
            >
              Open Campus Map &rarr;
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              About Project
            </Link>
          </div>
        </div>
      </section>

      {/* Sitewide Footer */}
      <EditorialFooter />
    </div>
  );
}
