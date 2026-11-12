"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CampusLocation } from "@/types/campus";
import { assistanceService } from "@/services/assistanceService";
import { AssistanceRequestRead, AssistanceType } from "@/types/api";
import { HelpCircleIcon, CheckCircleIcon } from "./DashboardIcons";
import { Spinner } from "@/components/icons/Icons";

interface HelpTabProps {
  locations?: CampusLocation[];
}

export function HelpTab({ locations = [] }: HelpTabProps) {
  const { user } = useAuth();

  // Form states
  const [assistanceType, setAssistanceType] = useState<AssistanceType>("lost");
  const [requesterName, setRequesterName] = useState<string>(
    user?.full_name || user?.name || ""
  );
  const [contactPhone, setContactPhone] = useState<string>(user?.phone || "");
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Submission lifecycle
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<AssistanceRequestRead | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate backend requirement: at least one of target location, phone, or description
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
      // Reset form fields
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
    { label: "Campus Safety & Security Operations", facility: "Robertson Hall, Room 203", hours: "24/7 Dispatch" },
    { label: "Student Health & Wellness Services", facility: "CTTC Building, Suite 2600", hours: "Mon–Fri, 8:30–16:30" },
    { label: "Paul Menton Centre for Accessibility", facility: "MacOdrum Library, 5th Floor", hours: "Mon–Fri, 8:30–16:30" },
    { label: "Campus Information & Visitor Desk", facility: "University Centre (Tory Quad)", hours: "Daily, 8:00–20:00" },
  ];

  const faqs = [
    {
      q: "How do I find a specific lecture hall or lab?",
      a: "Use the top search bar or the Destination panel on the Explore tab. Type the building name (e.g., 'MacOdrum Library' or 'Paterson Hall') to highlight its location on the map.",
    },
    {
      q: "Are all campus paths accessible by wheelchair?",
      a: "The main pedestrian promenades feature zero-barrier grade transitions. Route calculation factors in accessible pathways when requested.",
    },
    {
      q: "Where is visitor parking located?",
      a: "Visitor parking is situated at Parking Area 1 adjacent to Main Gate, equipped with EV charging stations and pay-on-exit kiosks.",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-xs font-semibold text-[#fca5a5] mb-2">
          <HelpCircleIcon className="w-3.5 h-3.5" />
          <span>Visitor & Campus Assistance</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Help & Navigation Support
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Assistance for first-time campus visitors, students, and accessibility requests.
        </p>
      </div>

      {/* Visitor Assistance Request Form / Live Ticket Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Request Live Navigation Assistance
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Submit an inquiry to the Campus Help Desk. Persisted directly in PostgreSQL.
            </p>
          </div>
          <div className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 self-start sm:self-auto">
            {user ? `User: ${user.name || user.email}` : "Mode: Guest Visitor"}
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {submitError}
          </div>
        )}

        {submittedTicket ? (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-emerald-200">
                    Assistance Request Received & Persisted
                  </h4>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                    {submittedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  Your request has been registered in the CampusWay support queue.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-950/60 p-3.5 rounded-xl border border-emerald-900/40 font-mono">
              <div>
                <span className="text-zinc-500">Ticket ID:</span>{" "}
                <span className="text-zinc-200">{submittedTicket.id}</span>
              </div>
              <div>
                <span className="text-zinc-500">Assistance Type:</span>{" "}
                <span className="text-zinc-200 capitalize">{submittedTicket.assistance_type.replace("_", " ")}</span>
              </div>
              <div>
                <span className="text-zinc-500">Submitted At:</span>{" "}
                <span className="text-zinc-200">{new Date(submittedTicket.created_at).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-zinc-500">Assigned Profile:</span>{" "}
                <span className="text-zinc-200">{submittedTicket.user_id ? "Linked Account" : "Guest Request"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assistance Type */}
              <div>
                <label
                  htmlFor="assistance-type"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Assistance Type
                </label>
                <select
                  id="assistance-type"
                  value={assistanceType}
                  onChange={(e) => setAssistanceType(e.target.value as AssistanceType)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-[#DE4B31] cursor-pointer"
                >
                  <option value="lost">Lost / Wayfinding Guidance</option>
                  <option value="mobility_support">Accessibility & Mobility Support</option>
                  <option value="general_inquiry">General Campus Inquiry</option>
                  <option value="medical">Non-Emergency Medical Support</option>
                </select>
              </div>

              {/* Target Location */}
              <div>
                <label
                  htmlFor="target-location"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Destination Building (Optional)
                </label>
                <select
                  id="target-location"
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-[#DE4B31] cursor-pointer"
                >
                  <option value="">-- Select Destination (Optional) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Requester Name */}
              <div>
                <label
                  htmlFor="requester-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Your Name (Optional)
                </label>
                <input
                  id="requester-name"
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  disabled={isSubmitting}
                  maxLength={120}
                  className="w-full p-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#DE4B31]"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Contact Phone (Optional)
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 613 520 2600"
                  disabled={isSubmitting}
                  maxLength={20}
                  className="w-full p-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#DE4B31]"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label
                htmlFor="issue-description"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Inquiry or Issue Description
              </label>
              <textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Need directions to the Dean's office or wheelchair ramp location at Paterson Hall."
                rows={3}
                disabled={isSubmitting}
                maxLength={1000}
                className="w-full p-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#DE4B31]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] disabled:opacity-50 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#DE4B31]/20"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 text-white" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Submit Assistance Request</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Campus Support & Information Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Campus Service Desks & Operations
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">On-Campus Directory</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campusSupportDirectory.map((contact, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-white">{contact.label}</p>
                <p className="text-[11px] text-zinc-400">{contact.facility}</p>
              </div>
              <span className="text-[10px] font-mono font-medium text-[#fca5a5] bg-[#DE4B31]/10 px-2 py-1 rounded-lg border border-[#DE4B31]/20">
                {contact.hours}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 italic">
          Note: For immediate physical assistance, use the on-campus emergency call stations equipped with blue beacon lights stationed across walkways.
        </p>
      </div>

      {/* Frequently Asked Questions - Informational Guide */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Frequently Asked Questions
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">Informational Guide</span>
        </div>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <h4 className="text-xs font-bold text-zinc-100">{faq.q}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
