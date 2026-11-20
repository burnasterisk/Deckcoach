export type ObstacleKind = "rail" | "ledge" | "gap" | "ramp" | "box" | "manual-pad";

export interface ObstacleMap {
  id: string;
  name: string;
  kind: ObstacleKind;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  widthDecks: number;
  heightDecks: number;
  depthDecks: number;
  referenceDeckLengthMm: number;
  createdAt: number;
}

export interface ObstacleMeasurement {
  widthPx: number;
  heightPx: number;
  boardLengthPx: number;
  boardLengthMm: number;
  /** Optional user-entered depth estimate; never inferred from a single 2D view. */
  depthMm?: number;
}

const STORAGE_KEY = "deckcoach.obstacle-maps.v1";

export function measureObstacle(selection: ObstacleMeasurement): Pick<
  ObstacleMap,
  "widthMm" | "heightMm" | "depthMm" | "widthDecks" | "heightDecks" | "depthDecks" | "referenceDeckLengthMm"
> {
  const boardPx = Number.isFinite(selection.boardLengthPx) && selection.boardLengthPx > 0
    ? selection.boardLengthPx
    : 1;
  const requestedDeckMm = Number.isFinite(selection.boardLengthMm) ? selection.boardLengthMm : 98;
  const deckMm = Math.max(60, Math.min(140, requestedDeckMm));
  const widthPx = Number.isFinite(selection.widthPx) ? Math.max(0, selection.widthPx) : 0;
  const heightPx = Number.isFinite(selection.heightPx) ? Math.max(0, selection.heightPx) : 0;
  const requestedDepthMm = Number.isFinite(selection.depthMm) ? (selection.depthMm ?? 0) : 0;
  const depthMm = Math.round(Math.max(0, Math.min(1000, requestedDepthMm)));
  const scale = deckMm / boardPx;
  const widthMm = Math.round(widthPx * scale);
  const heightMm = Math.round(heightPx * scale);
  return {
    widthMm,
    heightMm,
    // Depth is only stored when manually estimated; one camera view cannot resolve it.
    depthMm,
    widthDecks: Number((widthMm / deckMm).toFixed(2)),
    heightDecks: Number((heightMm / deckMm).toFixed(2)),
    depthDecks: Number((depthMm / deckMm).toFixed(2)),
    referenceDeckLengthMm: deckMm,
  };
}

export function getObstacleAdvice(obstacle: Pick<ObstacleMap, "kind" | "widthDecks" | "heightDecks">): {
  summary: string;
  suggestedTricks: string[];
  warning: string;
} {
  const height = obstacle.heightDecks;
  const heightNote = height < 0.2
    ? "Very low profile: focus on accuracy and clean contact rather than pop height."
    : height > 1.25
      ? "Tall obstacle: the current camera only estimates visible 2D dimensions; approach cautiously and verify real clearance by eye."
      : "Height is within a useful practice range for the current board-scale estimate.";

  switch (obstacle.kind) {
    case "rail":
      return {
        summary: "Rail session: approach straight, clear the bar, then keep the deck centred over the rail line.",
        suggestedTricks: ["50-50 Grind", "5-0 Grind", "Boardslide", "Feeble Grind", "Lipslide"],
        warning: heightNote,
      };
    case "ledge":
      return {
        summary: "Ledge session: use the front truck or deck edge as the contact point and travel parallel to the coping.",
        suggestedTricks: ["50-50 Grind", "Nosegrind", "Crooked Grind", "Noseslide", "Tailslide", "Overcrook Grind"],
        warning: heightNote,
      };
    case "gap":
      return {
        summary: "Gap session: prioritise pop height, forward travel and a level catch beyond the far edge.",
        suggestedTricks: ["Ollie", "Boned Ollie", "Kickflip", "Heelflip", "Pop Shuvit", "Tre Flip"],
        warning: obstacle.widthDecks > 2.5
          ? "The marked gap is over 2.5 deck lengths wide. The camera does not measure approach speed, so use this as a visual scale only."
          : heightNote,
      };
    case "ramp":
      return {
        summary: "Ramp session: keep your fingers low through the transition and avoid forcing a flat-ground scoop at the lip.",
        suggestedTricks: ["Ollie", "Nollie", "Fakie Ollie", "Pop Shuvit", "Kickflip"],
        warning: "The box gives a 2D size estimate only; transition curvature and angle are not reconstructed.",
      };
    case "box":
      return {
        summary: "Box session: work on straight approaches, short pop timing and predictable truck locks.",
        suggestedTricks: ["50-50 Grind", "5-0 Grind", "Nosegrind", "Boardslide", "Crooked Grind"],
        warning: heightNote,
      };
    default:
      return {
        summary: "Manual-pad session: use the top surface as a balance zone and keep the approach centred.",
        suggestedTricks: ["Ollie", "Boned Ollie", "Nollie", "Pop Shuvit", "Kickflip"],
        warning: "Manual and nose-manual balance are not scored by the current pop-based analyser yet.",
      };
  }
}

function isObstacleMap(value: unknown): value is ObstacleMap {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ObstacleMap>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    ["rail", "ledge", "gap", "ramp", "box", "manual-pad"].includes(String(item.kind)) &&
    [item.widthMm, item.heightMm, item.depthMm, item.widthDecks, item.heightDecks, item.depthDecks, item.referenceDeckLengthMm, item.createdAt].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0) &&
    typeof item.referenceDeckLengthMm === "number" && Number.isFinite(item.referenceDeckLengthMm) && item.referenceDeckLengthMm > 0
  );
}

export function loadObstacleMaps(): ObstacleMap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isObstacleMap).slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function saveObstacleMaps(maps: ObstacleMap[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps.filter(isObstacleMap).slice(0, 12)));
  } catch {
    // The in-memory session remains usable when storage is unavailable.
  }
}
