import type { WasteBinKind } from "@/lib/types";

export type { WasteBinKind };

export const wasteBinLabel: Record<WasteBinKind, string> = {
  rest: "Restmüll",
  bio: "Biomüll",
  gelb: "Gelber Sack",
  papier: "Papier",
  elektro: "Elektro",
  sperr: "Sperrmüll",
  other: "Abfall",
};

/** Füllfarbe der Tonne in der UI. */
export const wasteBinColor: Record<WasteBinKind, string> = {
  rest: "#3d4450",
  bio: "#6b8f4e",
  gelb: "#e2b600",
  papier: "#4a7ab0",
  elektro: "#7a6b9a",
  sperr: "#8a7355",
  other: "#5a9a7a",
};

export function classifyWasteBin(summary: string): WasteBinKind {
  const s = summary.toLowerCase();
  if (s.includes("bio")) return "bio";
  if (s.includes("gelb") || s.includes("wertstoff") || s.includes("verpack"))
    return "gelb";
  if (s.includes("papier") || s.includes("pappe") || s.includes("karton"))
    return "papier";
  if (
    s.includes("elektro") ||
    s.includes("kühl") ||
    s.includes("bildschirm") ||
    s.includes("fernseh")
  ) {
    return "elektro";
  }
  if (s.includes("sperr")) return "sperr";
  if (s.includes("rest") || s.includes("hausmüll") || s.includes("hausmuell"))
    return "rest";
  if (s.includes("müll") || s.includes("muell") || s.includes("abfall"))
    return "other";
  return "other";
}

export function isWasteEvent(title: string, wasteBin?: WasteBinKind): boolean {
  if (wasteBin) return true;
  const s = title.toLowerCase();
  return (
    s.includes("müll") ||
    s.includes("muell") ||
    s.includes("tonne") ||
    s.includes("sack") ||
    s.includes("abfall") ||
    s.includes("papier") ||
    s.includes("sperr") ||
    s.includes("elektro")
  );
}
