import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { CampusBranding } from "@/components/layout/CampusBranding";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "CampusWay — Create Account",
  description:
    "Join CampusWay to explore campus maps, calculate step-by-step routes, and locate university facilities.",
};

export default function SignupPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
      {/* Background Photography with subtle dusk overlay */}
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

      {/* Main Content: Centered Card with Right-Side Branding */}
      <main className="relative flex-1 w-full flex items-center justify-center px-4 py-6 sm:py-10">
        {/* Right-Side Branding: FIND EXPLORE BELONG */}
        <div className="absolute right-8 md:right-16 lg:right-24 xl:right-32 top-1/2 -translate-y-1/2 hidden lg:block z-10 pointer-events-none">
          <CampusBranding />
        </div>

        {/* Centered Signup Card */}
        <div className="z-20 w-full flex justify-center">
          <AuthCard
            heading="Welcome to CampusWay"
            subtitle="Create an account to explore your campus"
            footer={
              <p>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#C84B31] hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            }
          >
            <SignupForm />
          </AuthCard>
        </div>
      </main>

      {/* Bottom spacer */}
      <div className="w-full h-4" />
    </div>
  );
}
