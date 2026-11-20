import type { BoardHandlingTuning, DeckSetupId } from "./setup";

export type BoardGrip = "sandpaper" | "foam" | "silicone";
export type BoardWidth = "narrow" | "standard" | "wide";
export type BoardShape = "popsicle" | "old-school" | "custom";
export type BoardWeightFeel = "light" | "balanced" | "heavy";
export type BoardConcave = "low" | "medium" | "high";
export type BoardLength = "short" | "standard" | "long";

export interface BoardProfile {
  id: string;
  name: string;
  material: DeckSetupId;
  grip: BoardGrip;
  width: BoardWidth;
  shape: BoardShape;
  /** Qualitative deck feel; converted to small coaching-sensitivity heuristics. */
  weightFeel?: BoardWeightFeel;
  concave?: BoardConcave;
  deckLength?: BoardLength;
  photoDataUrl?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "deckcoach.board-profiles.v1";

function isBoardProfile(value: unknown): value is BoardProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<BoardProfile>;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    (profile.material === "plastic" || profile.material === "wood") &&
    (profile.grip === "sandpaper" || profile.grip === "foam" || profile.grip === "silicone") &&
    (profile.width === "narrow" || profile.width === "standard" || profile.width === "wide") &&
    (profile.shape === "popsicle" || profile.shape === "old-school" || profile.shape === "custom") &&
    (profile.weightFeel === undefined || ["light", "balanced", "heavy"].includes(profile.weightFeel)) &&
    (profile.concave === undefined || ["low", "medium", "high"].includes(profile.concave)) &&
    (profile.deckLength === undefined || ["short", "standard", "long"].includes(profile.deckLength)) &&
    typeof profile.createdAt === "number" &&
    typeof profile.updatedAt === "number"
  );
}

export function loadBoardProfiles(): BoardProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isBoardProfile) : [];
  } catch {
    return [];
  }
}

export function saveBoardProfiles(profiles: BoardProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // If photo data fills localStorage, preserve the setup details without the images.
    try {
      const withoutPhotos = profiles.map(({ photoDataUrl: _photo, ...profile }) => profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhotos));
    } catch {
      // The app remains usable in-memory when storage is unavailable.
    }
  }
}

export function getBoardGripLabel(gripType: BoardGrip): string {
  return gripType === "foam" ? "Foam" : gripType === "silicone" ? "Silicone" : "Sandpaper";
}

export function getBoardProfileLabel(profile: BoardProfile): string {
  const material = profile.material === "wood" ? "Wood" : "Plastic";
  const grip = getBoardGripLabel(profile.grip);
  const weight = profile.weightFeel ? ` · ${profile.weightFeel}` : "";
  return `${material} · ${grip}${weight}`;
}

export function getBoardWidthLabel(width: BoardWidth): string {
  switch (width) {
    case "narrow":
      return "Narrow · 26–30 mm";
    case "wide":
      return "Wide · 34–36 mm";
    default:
      return "Standard · 31–33 mm";
  }
}


export function getBoardLengthMm(profile?: Pick<BoardProfile, "deckLength"> | null): number {
  switch (profile?.deckLength) {
    case "short": return 94;
    case "long": return 102;
    default: return 98;
  }
}

export function getBoardHandlingTuning(profile?: BoardProfile | null): BoardHandlingTuning {
  const weight = profile?.weightFeel === "heavy" ? 1.1 : profile?.weightFeel === "light" ? 0.94 : 1;
  const concave = profile?.concave === "high" ? 0.96 : profile?.concave === "low" ? 1.04 : 1;
  const width = profile?.width === "wide" ? 1.04 : profile?.width === "narrow" ? 0.96 : 1;
  return {
    popThresholdMultiplier: Math.min(1.2, Math.max(0.85, weight * concave)),
    landingBandMultiplier: profile?.weightFeel === "heavy" ? 1.08 : 1,
    idealSpreadMultiplier: width,
  };
}
