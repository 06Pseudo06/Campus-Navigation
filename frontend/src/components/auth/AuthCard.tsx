import React, { ReactNode } from "react";

interface AuthCardProps {
  heading: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({
  heading,
  subtitle,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-[415px] sm:max-w-[425px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.32)] p-7 sm:p-8 transition-all">
      {/* Centered Heading & Subtitle */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight leading-snug">
          {heading}
        </h1>
        <p className="mt-1 text-xs sm:text-[13px] text-gray-500 font-normal">
          {subtitle}
        </p>
      </div>

      {/* Main card content */}
      <div>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="mt-5 text-center text-xs sm:text-[13px] text-gray-600">
          {footer}
        </div>
      )}
    </div>
  );
}
