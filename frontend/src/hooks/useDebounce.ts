"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to debounce values (e.g. search inputs) by a given delay.
 * Prevents rapid unnecessary recalculations or re-renders on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
