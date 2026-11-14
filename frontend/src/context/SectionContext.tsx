"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SectionContextType {
  activeSection: string; // "01", "02", "03", "04", "05", "06"
  isDarkSection: boolean;
  setActiveSection: (sec: string) => void;
  setIsDarkSection: (dark: boolean) => void;
}

const SectionContext = createContext<SectionContextType>({
  activeSection: "01",
  isDarkSection: false,
  setActiveSection: () => {},
  setIsDarkSection: () => {},
});

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("01");
  const [isDarkSection, setIsDarkSection] = useState(false);

  // Sync dark class on body or html for global theme styling
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDarkSection) {
        document.documentElement.classList.add("theme-dark-active");
      } else {
        document.documentElement.classList.remove("theme-dark-active");
      }
    }
  }, [isDarkSection]);

  return (
    <SectionContext.Provider
      value={{
        activeSection,
        isDarkSection,
        setActiveSection,
        setIsDarkSection,
      }}
    >
      {children}
    </SectionContext.Provider>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
