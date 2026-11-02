"use client";

import React, { useState } from "react";
import { HelpCircleIcon, CheckCircleIcon } from "./DashboardIcons";

export function HelpTab() {
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSent, setTicketSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setTicketMessage("");
    }, 4000);
  };

  const emergencyContacts = [
    { label: "Campus Security Kiosk (24/7)", number: "+1 (555) 019-2831", location: "Main Gate" },
    { label: "Student Medical Center", number: "+1 (555) 019-2832", location: "Sports Complex Wing A" },
    { label: "Accessibility & Disability Support", number: "+1 (555) 019-2833", location: "Admin Block, Rm 104" },
    { label: "Campus Transit & Shuttle Dispatch", number: "+1 (555) 019-2834", location: "South Transit Hub" },
  ];

  const faqs = [
    {
      q: "How do I find a specific lecture hall or lab?",
      a: "Use the top search bar or the Destination panel on the Explore tab. Type the room number (e.g., '3402' or 'Robotics') to highlight its building on the map.",
    },
    {
      q: "Are all campus paths accessible by wheelchair?",
      a: "The main pedestrian promenades shown on the map feature zero-barrier grade transitions. You can switch to the 'Accessibility Ramps' map layer for high-contrast ramp markers.",
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

      {/* Emergency Contacts */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Essential Contacts & Emergency
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-white">{contact.label}</p>
                <p className="text-[11px] text-zinc-400">{contact.location}</p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#DE4B31] bg-[#DE4B31]/10 px-2.5 py-1 rounded-lg border border-[#DE4B31]/20">
                {contact.number}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Frequently Asked Questions
        </h3>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <h4 className="text-xs font-bold text-zinc-100">{faq.q}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Visitor Assistance Request Form */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
        <h3 className="text-sm font-bold text-white">
          Need Guided Wayfinding Assistance?
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Submit a navigation question to the campus information desk.
        </p>

        {ticketSent ? (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Demonstration inquiry received! A campus guide notification would trigger here in Phase 4.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="e.g. Where is the Dean of Engineering's office located in Block 34?"
              rows={3}
              className="w-full p-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#DE4B31]"
              required
            />
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Send Request (Demo)
            </button>
          </form>
        )}
      </div>

      <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-[11px] text-zinc-500">
        Help desk interactions are simulated for Phase 3. Live ticketing will be connected to the FastAPI notification service in future releases.
      </div>
    </div>
  );
}
