import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { CampusBranding } from "@/components/layout/CampusBranding";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "CampusWay — Sign In",
  description:
    "Sign in to CampusWay to explore your campus, find lecture halls, department buildings, and navigate facilities.",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
      {/* Background Photography with subtle realistic dusk overlay */}
      <div className="fixed inset-0 -z-10 w-full h-full">
        <Image
          src="/images/campus-bg.jpg"
          alt="Modern university campus architecture illuminated during dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Subtle dusk overlay matching design reference */}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/20" />
      </div>

      {/* Top Header / Navigation */}
      <Navbar />

      {/* Main Content: Card Centered, Slogan on Right */}
      <main className="relative flex-1 w-full flex items-center justify-center px-4 py-6 sm:py-10">
        {/* Right-Side Branding: FIND EXPLORE BELONG */}
        <div className="absolute right-8 md:right-16 lg:right-24 xl:right-32 top-1/2 -translate-y-1/2 hidden lg:block z-10 pointer-events-none">
          <CampusBranding />
        </div>

        {/* Centered Login Card */}
        <div className="z-20 w-full flex justify-center">
          <AuthCard
            heading="Welcome to CampusWay"
            subtitle="Sign in to explore your campus"
            footer={
              <p>
                New to CampusWay?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[#C84B31] hover:underline transition-colors"
                >
                  Create an account
                </Link>
              </p>
            }
          >
            <div className="mb-4 p-3 rounded-xl bg-zinc-900/90 border border-[#DE4B31]/40 text-xs text-zinc-300">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Guest Access Recommended</span>
              </div>
              <p className="mt-1 text-zinc-400 text-[11px] leading-relaxed">
                Authentication is deferred for this demo milestone. All campus wayfinding, graph routing, destination search, and local bookmarks are unlocked without sign-in.
              </p>
              <Link
                href="/explore"
                className="mt-2.5 w-full py-2 px-3 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#DE4B31]/20 cursor-pointer"
              >
                <span>Continue as Guest Explorer →</span>
              </Link>
            </div>
            <LoginForm />
          </AuthCard>
        </div>
      </main>

      {/* Subtle bottom spacer */}
      <div className="w-full h-4" />
    </div>
  );
}
