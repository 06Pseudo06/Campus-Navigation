import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useDebounce logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces rapid value changes by delay", () => {
    let capturedValue = "initial";
    let timer: ReturnType<typeof setTimeout> | null = null;

    const updateDebounced = (newVal: string, delayMs: number = 250) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        capturedValue = newVal;
      }, delayMs);
    };

    updateDebounced("input 1");
    expect(capturedValue).toBe("initial");

    vi.advanceTimersByTime(100);
    expect(capturedValue).toBe("initial");

    updateDebounced("input 2");
    vi.advanceTimersByTime(100);
    expect(capturedValue).toBe("initial");

    vi.advanceTimersByTime(150);
    expect(capturedValue).toBe("input 2");
  });
});
