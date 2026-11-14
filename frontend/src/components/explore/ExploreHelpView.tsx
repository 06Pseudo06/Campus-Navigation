"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CampusLocation } from "@/types/campus";
import { assistanceService } from "@/services/assistanceService";
import { AssistanceRequestRead, AssistanceType } from "@/types/api";

interface ExploreHelpViewProps {
  locations?: CampusLocation[];
}

export function ExploreHelpView({ locations = [] }: ExploreHelpViewProps) {
  const { user } = useAuth();

  const [assistanceType, setAssistanceType] = useState<AssistanceType>("lost");
  const [requesterName, setRequesterName] = useState<string>(
    user?.full_name || user?.name || ""
  );
  const [contactPhone, setContactPhone] = useState<string>(user?.phone || "");
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<AssistanceRequestRead | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!description.trim() && !contactPhone.trim() && !targetLocationId) {
      setSubmitError(
        "Please provide an issue description, a contact phone number, or select a destination building."
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
          : "Failed to submit assistance request. Please try again or call emergency contacts below."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const emergencyContacts = [
    { name: "Campus Safety Services", phone: "(613) 520-4444", ext: "Ext. 4444 (Emergency)", note: "24/7 Dispatch" },
    { name: "Student Health & Wellness", phone: "(613) 520-6674", ext: "2600 CTTC", note: "Mon-Fri 8:30-16:30" },
    { name: "Accessibility Services (PMC)", phone: "(613) 520-6608", ext: "501 University Centre", note: "Academic Accommodations" },
    { name: "ITS Service Desk", phone: "(613) 520-3700", ext: "Online / Phone", note: "IT & Digital Wayfinding" },
  ];

  const shortcutsCol1 = [
    { key: "/", desc: "Focus global campus search" },
    { key: "+ / =", desc: "Zoom in on interactive map" },
    { key: "- / _", desc: "Zoom out on interactive map" },
    { key: "Arrow keys", desc: "Pan map viewport" },
    { key: "0", desc: "Reset map zoom and center" },
    { key: "Esc", desc: "Clear active search or dismiss modals" },
  ];

  const shortcutsCol2 = [
    { key: "C", desc: "Calculate route between selected points" },
    { key: "S", desc: "Bookmark / unbookmark active destination" },
    { key: "Enter", desc: "Select focused destination in list" },
    { key: "Shift + Click", desc: "Set building as starting Origin point" },
    { key: "Click Node", desc: "Set building as Destination point" },
  ];

  return (
    <div className="h-full overflow-y-auto px-6 py-6 lg:px-8 space-y-6 max-w-6xl mx-auto select-none slim-scrollbar pb-10">
      {/* Concise Sub-Heading (Toolbar already has contextual H1) */}
      <div className="space-y-1 pb-3 border-b border-[#E1DDD3]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#6B665C]">
          <span className="text-[#E8542F]">&mdash;</span>
          <span>SUPPORT &amp; DISPATCH DIRECTORY</span>
        </div>
        <p className="text-xs sm:text-sm text-[#6B665C] font-sans leading-relaxed">
          Request walking escorts, report accessibility barriers, or access 24/7 campus safety dispatch.
        </p>
      </div>

      {/* Row 1: 7fr / 5fr Balanced Grid (Cards Stretch to Equal Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Dispatch Request Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[20px] bg-white border border-[#E1DDD3] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)] flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B665C] block">
                DISPATCH FORM &bull; IMMEDIATE RESPONSE
              </span>
              <h3 className="text-xl font-bold uppercase tracking-tight text-[#0E1118] font-sans">
                Submit Assistance Request
              </h3>
            </div>

            {submittedTicket && (
              <div className="p-3.5 rounded-[14px] bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 space-y-1">
                <p className="font-bold">✓ Assistance Ticket Dispatched Successfully</p>
                <p className="text-[11px] text-emerald-700">
                  Ticket ID: <span className="font-bold">{submittedTicket.id}</span> &bull; Status: {submittedTicket.status}
                </p>
              </div>
            )}

            {submitError && (
              <div className="p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 text-xs font-sans text-rose-800">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
              {/* Assistance Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-[#6B665C] block">
                  ASSISTANCE TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "lost", label: "Lost / Directions" },
                    { id: "accessibility", label: "Accessibility Escort" },
                    { id: "facility", label: "Facility Access" },
                    { id: "emergency", label: "Urgent Assistance" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAssistanceType(t.id as AssistanceType)}
                      className={`py-2 px-3 rounded-[12px] border text-left font-semibold transition-all cursor-pointer ${
                        assistanceType === t.id
                          ? "bg-[#E8542F] text-white border-[#E8542F] shadow-2xs"
                          : "bg-[#F7F5F0] text-[#6B665C] border-[#E1DDD3] hover:text-[#0E1118] hover:border-[#0E1118]/30"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-[#6B665C]">
                    YOUR NAME
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Visitor Name"
                    className="w-full h-10 px-3 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-[#6B665C]">
                    CONTACT PHONE
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(613) 555-0199"
                    className="w-full h-10 px-3 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
                  />
                </div>
              </div>

              {/* Target Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-[#6B665C]">
                  DESTINATION / RELEVANT BUILDING
                </label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange cursor-pointer"
                >
                  <option value="">Select target building (Optional)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code ? `[${loc.code}] ` : ""}{loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description (Flexes to fill remaining vertical height) */}
              <div className="space-y-1 flex-1 flex flex-col">
                <label className="text-[10px] font-mono uppercase font-bold text-[#6B665C]">
                  DETAILS / LOCATION DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where you are or what assistance you need..."
                  className="w-full flex-1 min-h-[72px] p-3 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange resize-none"
                />
              </div>

              {/* Submit Button Docked at Bottom */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F0643A] to-[#E8542F] hover:from-[#E8542F] hover:to-[#C9411F] text-white font-mono font-bold uppercase text-xs tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? "Dispatching Request..." : "SUBMIT DISPATCH REQUEST ↗"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Emergency Contacts (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-[20px] bg-white border border-[#E1DDD3] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)] flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#6B665C] uppercase tracking-wider block">
              CAMPUS DIRECTORY &bull; 24/7 SUPPORT
            </span>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#0E1118] font-sans">
              Emergency Contacts
            </h3>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {emergencyContacts.map((c, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[14px] bg-[#F7F5F0] border border-[#E1DDD3] space-y-1.5 transition-colors hover:bg-white hover:border-[#0E1118]/25 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0E1118] font-sans">{c.name}</span>
                  <span className="text-[10px] font-mono text-[#E8542F] font-bold px-2 py-0.5 rounded-full bg-[#E8542F]/10">
                    {c.note}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6B665C]">
                  <span className="font-semibold text-[#0E1118]">{c.phone}</span>
                  <span>{c.ext}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-[12px] bg-[#0E1118] text-[#F4F1EA] text-[11px] font-mono flex items-center justify-between">
            <span>Direct 24/7 Red-Pole Callbox:</span>
            <span className="text-[#E8542F] font-bold">Line 4444</span>
          </div>
        </div>
      </div>

      {/* Row 2: Full Width Keyboard Navigation Card (Evenly Split 2-Column List) */}
      <div className="w-full p-6 rounded-[20px] bg-white border border-[#E1DDD3] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1DDD3]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#6B665C] uppercase tracking-wider block">
              EFFICIENCY CHEATSHEET
            </span>
            <h3 className="text-lg font-bold uppercase tracking-tight text-[#0E1118] font-sans">
              Keyboard Navigation &amp; Shortcuts
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#6B665C] uppercase">
            11 Global Keybindings
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
          {/* Column 1 */}
          <div className="space-y-2">
            {shortcutsCol1.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-[#E1DDD3]/60 last:border-none"
              >
                <span className="text-[#0E1118] font-sans">{s.desc}</span>
                <kbd className="px-2 py-0.5 rounded-[6px] bg-[#F7F5F0] border border-[#E1DDD3] font-mono font-bold text-[#0E1118] text-[10px] shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="space-y-2">
            {shortcutsCol2.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-[#E1DDD3]/60 last:border-none"
              >
                <span className="text-[#0E1118] font-sans">{s.desc}</span>
                <kbd className="px-2 py-0.5 rounded-[6px] bg-[#F7F5F0] border border-[#E1DDD3] font-mono font-bold text-[#0E1118] text-[10px] shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
