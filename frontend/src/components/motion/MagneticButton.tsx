"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { isReducedMotion } from "@/lib/motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "orange";
  cursorLabel?: string;
}

export function MagneticButton({
  children,
  href,
  onClick,
  className = "",
  variant = "primary",
  cursorLabel = "EXPLORE",
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isReducedMotion() || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    // Magnetic pull displacement (clamped)
    const pullX = x * 0.28;
    const pullY = y * 0.28;

    buttonRef.current.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${pullX * 0.15}px, ${pullY * 0.15}px, 0)`;
    }
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    buttonRef.current.style.transform = "translate3d(0, 0, 0)";
    buttonRef.current.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    if (contentRef.current) {
      contentRef.current.style.transform = "translate3d(0, 0, 0)";
      contentRef.current.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    }
    setTimeout(() => {
      if (buttonRef.current) buttonRef.current.style.transition = "";
      if (contentRef.current) contentRef.current.style.transition = "";
    }, 400);
  };

  // Base styling variants
  let variantStyles = "";
  if (variant === "primary") {
    variantStyles = "bg-[#111111] text-white hover:text-white";
  } else if (variant === "orange") {
    variantStyles = "bg-[#E8542F] text-white hover:text-white shadow-lg shadow-[#E8542F]/25";
  } else {
    variantStyles = "bg-transparent text-[#111111] border border-[#111111]/25 hover:border-[#111111]";
  }

  const commonProps = {
    ref: buttonRef,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    "data-cursor": cursorLabel,
    className: `group relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm transition-shadow duration-300 select-none ${variantStyles} ${className}`,
  };

  const innerContent = (
    <>
      {/* Wipe Fill from bottom (black -> orange or white -> orange) */}
      <span
        className={`absolute inset-0 translate-y-full rounded-full transition-transform duration-300 ease-out group-hover:translate-y-0 ${
          variant === "orange" ? "bg-[#C9411F]" : "bg-[#E8542F]"
        }`}
        aria-hidden="true"
      />
      <span ref={contentRef} className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} {...commonProps}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} {...commonProps}>
      {innerContent}
    </button>
  );
}
