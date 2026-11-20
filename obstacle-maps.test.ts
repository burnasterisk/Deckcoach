import { describe, expect, it, beforeEach } from "vitest";

import { getObstacleAdvice, loadObstacleMaps, measureObstacle, saveObstacleMaps, type ObstacleMap } from "@/lib/obstacle-maps";
import { TRICKS } from "@/lib/tricks";

describe("offline obstacle mapping", () => {
  beforeEach(() => localStorage.clear());

  it("measures obstacle dimensions relative to the reference deck", () => {
    const measured = measureObstacle({ widthPx: 130, heightPx: 26, boardLengthPx: 260, boardLengthMm: 98 });
    expect(measured.widthMm).toBe(49);
    expect(measured.heightMm).toBe(10);
    expect(measured.widthDecks).toBe(0.5);
    expect(measured.heightDecks).toBe(0.1);
    expect(measured.depthMm).toBe(0);
    expect(measured.depthDecks).toBe(0);
  });

  it("keeps invalid pixel measurements finite instead of persisting NaN", () => {
    const measured = measureObstacle({ widthPx: Number.NaN, heightPx: -10, boardLengthPx: Number.NaN, boardLengthMm: Number.NaN });
    expect(measured.widthMm).toBe(0);
    expect(measured.heightMm).toBe(0);
    expect(Number.isFinite(measured.referenceDeckLengthMm)).toBe(true);
  });

  it("provides obstacle-specific trick suggestions without claiming exact 3D reconstruction", () => {
    const advice = getObstacleAdvice({ kind: "ledge", widthDecks: 1.2, heightDecks: 0.4 });
    expect(advice.suggestedTricks).toContain("Crooked Grind");
    expect(advice.warning).toContain("within a useful practice range");
  });

  it("only recommends tricks that exist in the catalogue", () => {
    const supportedNames = new Set(TRICKS.map((trick) => trick.name));
    for (const kind of ["rail", "ledge", "gap", "ramp", "box", "manual-pad"] as const) {
      const advice = getObstacleAdvice({ kind, widthDecks: 1, heightDecks: 0.5 });
      expect(advice.suggestedTricks.every((name) => supportedNames.has(name))).toBe(true);
    }
  });

  it("saves obstacle maps locally and filters invalid entries", () => {
    const map: ObstacleMap = {
      id: "spot-1",
      name: "Back ledge",
      kind: "ledge",
      widthMm: 50,
      heightMm: 20,
      depthMm: 0,
      widthDecks: 0.51,
      heightDecks: 0.2,
      depthDecks: 0,
      referenceDeckLengthMm: 98,
      createdAt: 10,
    };
    saveObstacleMaps([map]);
    expect(loadObstacleMaps()).toEqual([map]);
    localStorage.setItem("deckcoach.obstacle-maps.v1", JSON.stringify([map, { id: 4 }]));
    expect(loadObstacleMaps()).toEqual([map]);
  });
});
