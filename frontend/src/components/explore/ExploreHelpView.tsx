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

  const shortcuts = [
    { key: "/", desc: "Focus global campus search" },
    { key: "+ / =", desc: "Zoom in on interactive map" },
    { key: "- / _", desc: "Zoom out on interactive map" },
    { key: "Arrow keys", desc: "Pan map viewport" },
    { key: "0", desc: "Reset map zoom and center" },
    { key: "Esc", desc: "Clear active search or dismiss modals" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-5xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#111111]/12">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
          <span className="text-[#E8542F]">VISITOR ASSISTANCE /</span>
          <span>SUPPORT &amp; DISPATCH</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-[#111111]">
          Campus Support &amp; <span className="italic text-[#E8542F] font-serif font-normal normal-case">Guidance.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#5B5750] leading-relaxed max-w-xl">
          Request walking escorts, report accessibility barriers, or access campus safety dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Assistance Request Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[28px] bg-[#FBF8F2] border border-[#111111]/12 space-y-6 shadow-xs">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8542F] block">
              DISPATCH FORM
            </span>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#111111]">
              Submit Assistance Request
            </h3>
          </div>

          {submittedTicket && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 space-y-1">
              <p className="font-bold">✓ Assistance Ticket Dispatched Successfully</p>
              <p className="text-[11px] text-emerald-700">
                Ticket ID: <span className="font-bold">{submittedTicket.id}</span> &bull; Status: {submittedTicket.status}
              </p>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            {/* Assistance Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#5B5750] block">
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
                    className={`py-2 px-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      assistanceType === t.id
                        ? "bg-[#E8542F] text-white border-[#E8542F] shadow-2xs"
                        : "bg-white text-[#5B5750] border-[#111111]/12 hover:border-[#111111]/30"
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
                <label className="text-[10px] uppercase font-bold text-[#5B5750]">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Visitor Name"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#111111]/15 text-xs text-[#111111] focus:outline-none focus:border-[#E8542F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#5B5750]">
                  CONTACT PHONE
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(613) 555-0199"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#111111]/15 text-xs text-[#111111] focus:outline-none focus:border-[#E8542F]"
                />
              </div>
            </div>

            {/* Target Location */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#5B5750]">
                DESTINATION / RELEVANT BUILDING
              </label>
              <select
                value={targetLocationId}
                onChange={(e) => setTargetLocationId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#111111]/15 text-xs text-[#111111] focus:outline-none focus:border-[#E8542F] cursor-pointer"
              >
                <option value="">Select target building (Optional)</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code ? `[${loc.code}] ` : ""}{loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#5B5750]">
                DETAILS / LOCATION DESCRIPTION
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe where you are or what assistance you need..."
                className="w-full p-3 rounded-xl bg-white border border-[#111111]/15 text-xs text-[#111111] focus:outline-none focus:border-[#E8542F] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono font-bold uppercase text-xs tracking-wider transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Dispatching Request..." : "SUBMIT DISPATCH REQUEST ↗"}
            </button>
          </form>
        </div>

        {/* Right: Emergency Contacts & Keyboard Shortcuts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Emergency Contacts */}
          <div className="p-6 rounded-[28px] bg-[#FBF8F2] border border-[#111111]/12 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F] uppercase tracking-wider">
              <span>CAMPUS DIRECTORY</span>
            </div>
            <h3 className="text-lg font-bold uppercase tracking-tight text-[#111111]">
              Emergency Contacts
            </h3>

            <div className="space-y-3">
              {emergencyContacts.map((c, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white border border-[#111111]/10 space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111]">{c.name}</span>
                    <span className="text-[10px] text-[#E8542F] font-bold">{c.note}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#5B5750]">
                    <span>{c.phone}</span>
                    <span>{c.ext}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-6 rounded-[28px] bg-[#FBF8F2] border border-[#111111]/12 space-y-4 shadow-xs">
            <span className="text-xs font-mono font-bold text-[#E8542F] uppercase tracking-wider block">
              SHORTCUTS
            </span>
            <h3 className="text-lg font-bold uppercase tracking-tight text-[#111111]">
              Keyboard Navigation
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-[#111111]/08 last:border-none">
                  <span className="text-[#5B5750]">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-[#111111]/15 font-bold text-[#111111] text-[10px] shadow-2xs">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}