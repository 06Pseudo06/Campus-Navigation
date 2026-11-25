import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CATEGORIES, CATEGORY_LIST, getCategoryConfig } from "./categories";
import { iconMap } from "@/components/ui/Icon";

// Regex covering emoji pictorial ranges (excluding ASCII and Latin characters)
export const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

// Legitimate exceptions:
// - PhoneOtpForm.tsx: ISO country flag emoji strings for international phone code selection
// - Decorative architectural diamond ornament '✦' (U+2726)
export const ALLOW_LIST_FILES = [
  "PhoneOtpForm.tsx",
];

export function scanFileForEmojis(filePath: string): { line: number; text: string; match: string }[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: { line: number; text: string; match: string }[] = [];

  const fileName = path.basename(filePath);
  if (ALLOW_LIST_FILES.includes(fileName)) {
    return violations;
  }

  lines.forEach((lineText, idx) => {
    // Strip decorative diamond bullet '✦' and checkmark '✓'/'✕'
    const cleanText = lineText
      .replace(/✦/g, "")
      .replace(/✓/g, "")
      .replace(/✕/g, "");

    const match = cleanText.match(EMOJI_REGEX);
    if (match) {
      violations.push({
        line: idx + 1,
        text: lineText.trim(),
        match: match[0],
      });
    }
  });

  return violations;
}

describe("Icon System & Central Category Configuration", () => {
  it("central categories definition contains all 6 required campus categories", () => {
    expect(CATEGORY_LIST.length).toBe(6);
    const ids = CATEGORY_LIST.map((c) => c.id);
    expect(ids).toEqual(["all", "building", "hostel", "gate", "service", "landmark"]);
  });

  it("each category defines a Lucide icon component, valid hex color, and zero emoji glyphs", () => {
    Object.values(CATEGORIES).forEach((cat) => {
      expect(cat.icon).toBeDefined();
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(cat.label).not.toMatch(EMOJI_REGEX);
      expect(cat.bgTint).toBeDefined();
      expect(cat.textTint).toBeDefined();
    });
  });

  it("getCategoryConfig safely resolves unknown categories to default Academic category", () => {
    const fallback = getCategoryConfig("nonexistent_category_xyz");
    expect(fallback.id).toBe("building");
    expect(fallback.label).toBe("Academic");

    const allConfig = getCategoryConfig("all");
    expect(allConfig.id).toBe("all");
  });

  it("typed iconMap exports essential navigation and control icons", () => {
    expect(iconMap.all).toBeDefined();
    expect(iconMap.academic).toBeDefined();
    expect(iconMap.hostel).toBeDefined();
    expect(iconMap.gate).toBeDefined();
    expect(iconMap.service).toBeDefined();
    expect(iconMap.landmark).toBeDefined();
    expect(iconMap.walking).toBeDefined();
    expect(iconMap.accessible).toBeDefined();
    expect(iconMap.startPin).toBeDefined();
    expect(iconMap.destPin).toBeDefined();
    expect(iconMap.warning).toBeDefined();
    expect(iconMap.route).toBeDefined();
  });

  it("newly introduced Icon component and category definitions contain no UI emojis", () => {
    const iconFilePath = path.resolve(__dirname, "../components/ui/Icon.tsx");
    const catFilePath = path.resolve(__dirname, "./categories.ts");

    expect(scanFileForEmojis(iconFilePath)).toEqual([]);
    expect(scanFileForEmojis(catFilePath)).toEqual([]);
  });
});
