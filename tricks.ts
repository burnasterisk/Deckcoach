import { ADDITIONAL_TRICKS } from "./additional-tricks";
import type { DeckSetupId } from "./setup";

export type TrickCategory = "basics" | "flips" | "spins" | "grinds";

export interface TrickCategoryMeta {
  id: TrickCategory;
  label: string;
  short: string;
}

export const TRICK_CATEGORIES: TrickCategoryMeta[] = [
  { id: "basics", label: "Basics", short: "Basic" },
  { id: "flips", label: "Flips", short: "Flip" },
  { id: "spins", label: "Scoops/Spins", short: "Spin" },
  { id: "grinds", label: "Grinds/Slides", short: "Grind" },
];

export type TrickId =
  // Basics
  | "ollie"
  | "boned-ollie"
  | "nollie"
  | "fakie-ollie"
  | "switch-ollie"
  // Flips
  | "kickflip"
  | "heelflip"
  | "varial-kickflip"
  | "varial-heelflip"
  | "hardflip"
  | "inward-heelflip"
  | "double-kickflip"
  // Scoops/Spins
  | "pop-shuvit"
  | "fs-shuvit"
  | "360-shuvit"
  | "tre-flip"
  | "laser-flip"
  | "bigspin"
  | "gazelle-flip"
  | "impossible"
  // Grinds/Slides
  | "50-50-grind"
  | "5-0-grind"
  | "boardslide"
  | "smith-grind"
  | "crooked-grind"
  // Expanded pop-based fingerboard catalogue
  | "nollie-kickflip"
  | "fakie-kickflip"
  | "switch-kickflip"
  | "nollie-heelflip"
  | "fakie-heelflip"
  | "switch-heelflip"
  | "nollie-pop-shuvit"
  | "fakie-pop-shuvit"
  | "switch-pop-shuvit"
  | "double-heelflip"
  | "triple-kickflip"
  | "late-kickflip"
  | "late-heelflip"
  | "pressure-flip"
  | "pressure-heelflip"
  | "dolphin-flip"
  | "hospital-flip"
  | "underflip"
  | "fingerflip"
  | "casper-flip"
  | "kickflip-body-varial"
  | "double-varial-kickflip"
  | "fs-bigspin"
  | "bs-bigspin"
  | "360-bigspin"
  | "540-shuvit"
  | "720-shuvit"
  | "fakie-tre-flip"
  | "nollie-tre-flip"
  | "nosegrind"
  | "tailslide"
  | "noseslide"
  | "lipslide"
  | "feeble-grind"
  | "blunt-slide"
  | "noseblunt"
  | "overcrook"
  | "willy-grind"
  | "kickflip-50-50"
  | "kickflip-boardslide";

export interface FingerMark {
  finger: "I" | "M";
  /** Position on a 120×320 top-down deck, nose at the top. */
  x: number;
  y: number;
}

export interface VectorControlPoint {
  /** Forward/backward along deck axis (+1 = toward nose, -1 = toward tail). */
  along: number;
  /** Perpendicular to deck axis (-1 = upward/airborne, +1 = downward/tail-pocket). */
  perp: number;
}

export interface FingerVectorGuide {
  finger: "index" | "middle";
  label: string;
  points: VectorControlPoint[];
  tone: "primary" | "hazard";
}

export interface TrickPreviewSpec {
  /** Tail/nose pop pitch angle in degrees (positive = nose pitches upward, negative = nose dips). */
  popAngleDeg: number;
  /** Axial flip rotation in degrees (+360 kickflip, -360 heelflip, +720 double, 0 ollie/shuvit). */
  flipDeg: number;
  /** Horizontal spin rotation in degrees (+180 BS shuv, -180 FS shuv, +360 tre, +540 gazelle). */
  shuvDeg: number;
  /** Peak catch height as a multiple of deck length. */
  catchHeightNorm: number;
  /** Index finger mid-air flick/extension offset during step 2 (deck-length units). */
  flickReach: { forward: number; lift: number; lateral: number };
  /** Middle finger mid-air hover/scoop clearance offset during step 2 (deck-length units). */
  scoopSweep: { back: number; lift: number; lateral: number };
  /** Clean 3-step callouts synced to the slow-motion loop. */
  stepCallouts: readonly [string, string, string];
}

export type FlickMotionKind =
  | "slide-forward"
  | "slide-back"
  | "heel-flick"
  | "toe-flick"
  | "scoop-bs"
  | "scoop-fs"
  | "wrap-tail"
  | "grind-lock";

export interface TrickMotionSignature {
  /** Which end snaps against the surface first. */
  popOrigin: "tail" | "nose";
  /** Dominant flick/scoop pattern expected from the hand. */
  flickKind: FlickMotionKind;
  /** Expected total board flip degrees (absolute or signed). */
  expectedFlipDeg: number;
  /** Expected horizontal shuvit spin degrees (0 if straight). */
  expectedShuvDeg: number;
  /** Minimum wrist rotation in degrees expected during the trick (0 if wrist should stay square). */
  minWristTurnDeg: number;
  /** Maximum wrist turn allowed before unintentional over-twist. */
  maxWristTurnDeg: number;
  /** Ideal finger curl range [0..1] for snapping & flicking without stiffness or claw-pinch. */
  idealCurlRange: readonly [number, number];
  /** True if trick is a grind/slide that expects a mid-air plateau lock. */
  isGrind: boolean;
  /** Expected pitch bias at lock/catch (+ nose high for 5-0, - nose down for crooked/boned, 0 level). */
  targetCatchPitchDeg: number;
}

export interface Trick {
  id: TrickId;
  category: TrickCategory;
  name: string;
  short: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Whether the trick intentionally flips the board around its long axis. */
  hasFlip: boolean;
  fingers: FingerMark[];
  /** SVG path(s) for the motion arrows in top-down StanceGuide deck coordinates. */
  motion: string[];
  /** Live directional vector arrows extending from index (8) & middle (12) fingertips. */
  fingerVectors: FingerVectorGuide[];
  /** Slow-motion scale-matched Ghost Deck animation parameters. */
  preview: TrickPreviewSpec;
  /** Expected kinematic signature checked by TrickAnalyzer. */
  signature: TrickMotionSignature;
  cue: string;
  cues: Record<DeckSetupId, string>;
  /** Structured mechanics notes shown in the trick picker when available. */
  technique?: {
    setup: string;
    execution: string;
    timing: string;
    catch: string;
    commonFaults: readonly string[];
  };
}

const TAIL_POP_VECTOR: FingerVectorGuide = {
  finger: "middle",
  label: "POP",
  tone: "hazard",
  points: [
    { along: 0, perp: 0 },
    { along: -0.2, perp: 0.44 },
    { along: -0.1, perp: -0.5 },
  ],
};

const NOSE_POP_VECTOR: FingerVectorGuide = {
  finger: "index",
  label: "NOSE POP",
  tone: "hazard",
  points: [
    { along: 0, perp: 0 },
    { along: 0.22, perp: 0.44 },
    { along: 0.1, perp: -0.5 },
  ],
};

const HEEL_FLICK_VECTOR: FingerVectorGuide = {
  finger: "index",
  label: "HEEL FLICK",
  tone: "primary",
  points: [
    { along: 0, perp: 0 },
    { along: 0.46, perp: -0.62 },
    { along: 1.06, perp: -0.22 },
  ],
};

const TOE_FLICK_VECTOR: FingerVectorGuide = {
  finger: "index",
  label: "TOE FLICK",
  tone: "primary",
  points: [
    { along: 0, perp: 0 },
    { along: 0.44, perp: 0.38 },
    { along: 1.02, perp: -0.52 },
  ],
};

const BS_SCOOP_VECTOR: FingerVectorGuide = {
  finger: "middle",
  label: "BS SCOOP",
  tone: "hazard",
  points: [
    { along: 0, perp: 0 },
    { along: -0.38, perp: 0.64 },
    { along: -1.0, perp: 0.2 },
  ],
};

const FS_SCOOP_VECTOR: FingerVectorGuide = {
  finger: "middle",
  label: "FS PUSH",
  tone: "hazard",
  points: [
    { along: 0, perp: 0 },
    { along: -0.32, perp: -0.52 },
    { along: -0.92, perp: -0.24 },
  ],
};

const BASE_TRICKS: Trick[] = [
  // ==================== BASICS ====================
  {
    id: "ollie",
    category: "basics",
    name: "Ollie",
    short: "OL",
    difficulty: 1,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 120 },
      { finger: "M", x: 60, y: 270 },
    ],
    motion: ["M60 102 L60 62"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "SLIDE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.42, perp: -0.45 },
          { along: 0.92, perp: -0.34 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 34,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.62,
      flickReach: { forward: 0.14, lift: 0.1, lateral: 0 },
      scoopSweep: { back: 0.04, lift: 0.08, lateral: 0 },
      stepCallouts: ["1. Snap Tail", "2. Slide Nose", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "slide-forward",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 35,
      idealCurlRange: [0.18, 0.62],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Snap the tail with your middle finger, then slide your index toward the nose to level out.",
    cues: {
      plastic:
        "Snap the thin plastic tail fast, then drag hard across the sandpaper grip to level the nose.",
      wood: "Press into the foam grip, pop the 5-ply tail cleanly, and let the cushion pull the deck level.",
    },
  },
  {
    id: "boned-ollie",
    category: "basics",
    name: "Boned Ollie",
    short: "BO",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 108 },
      { finger: "M", x: 60, y: 272 },
    ],
    motion: ["M60 94 L60 40", "M60 250 L60 205"],
    fingerVectors: [
      {
        finger: "middle",
        label: "TUCK HIGH",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.18, perp: 0.48 },
          { along: 0.08, perp: -0.78 },
        ],
      },
      {
        finger: "index",
        label: "PUSH NOSE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.56, perp: -0.45 },
          { along: 1.15, perp: -0.1 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 38,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.72,
      flickReach: { forward: 0.24, lift: 0.04, lateral: 0 },
      scoopSweep: { back: 0.02, lift: 0.22, lateral: 0 },
      stepCallouts: ["1. Snap Tail", "2. Push Nose", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "slide-forward",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 35,
      idealCurlRange: [0.22, 0.68],
      isGrind: false,
      targetCatchPitchDeg: -10,
    },
    cue: "Pop steep, push your index forward past the bolts to bone the nose down, and tuck your middle finger up.",
    cues: {
      plastic:
        "Whip the plastic tail and press straight into the sandpaper nose kick so the tail snaps up behind.",
      wood: "Load the foam, drag deep into the nose pocket to dip the front trucks, and suck your middle finger up.",
    },
  },
  {
    id: "nollie",
    category: "basics",
    name: "Nollie",
    short: "NL",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 50 },
      { finger: "M", x: 60, y: 185 },
    ],
    motion: ["M60 202 L60 250"],
    fingerVectors: [
      NOSE_POP_VECTOR,
      {
        finger: "middle",
        label: "BACK SLIDE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: -0.42, perp: -0.45 },
          { along: -0.9, perp: -0.3 },
        ],
      },
    ],
    preview: {
      popAngleDeg: -32,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.56,
      flickReach: { forward: -0.04, lift: 0.1, lateral: 0 },
      scoopSweep: { back: 0.16, lift: 0.1, lateral: 0 },
      stepCallouts: ["1. Snap Nose", "2. Pull Middle", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "nose",
      flickKind: "slide-back",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 38,
      idealCurlRange: [0.2, 0.65],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Snap down on the nose with your index finger while gliding forward, then drag your middle finger back to level.",
    cues: {
      plastic:
        "Push weight forward over the sandpaper nose and snap briskly with your index tip — don't stall backward.",
      wood: "Lean your palm slightly forward into the foam nose kick so the index snap rebounds the 5-ply clean.",
    },
  },
  {
    id: "fakie-ollie",
    category: "basics",
    name: "Fakie Ollie",
    short: "FK",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 122 },
      { finger: "M", x: 60, y: 270 },
    ],
    motion: ["M60 140 L60 95"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "FAKE SLIDE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.36, perp: -0.44 },
          { along: 0.82, perp: -0.3 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 30,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.56,
      flickReach: { forward: 0.12, lift: 0.1, lateral: 0 },
      scoopSweep: { back: 0.06, lift: 0.09, lateral: 0 },
      stepCallouts: ["1. Snap Tail", "2. Level Backward", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "slide-forward",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 38,
      idealCurlRange: [0.18, 0.62],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Roll backward in your normal stance, snap the tail against momentum, and float level before landing.",
    cues: {
      plastic:
        "Keep momentum moving tail-first and snap quick on the plastic kick so sandpaper drag pulls it with you.",
      wood: "Stay centered over the foam concave while rolling backward — let your wrist absorb the pop rebound.",
    },
  },
  {
    id: "switch-ollie",
    category: "basics",
    name: "Switch Ollie",
    short: "SW",
    difficulty: 3,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 126 },
      { finger: "M", x: 60, y: 268 },
    ],
    motion: ["M60 110 L60 66"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "SW SLIDE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.38, perp: -0.48 },
          { along: 0.85, perp: -0.32 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 29,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.54,
      flickReach: { forward: 0.12, lift: 0.11, lateral: 0 },
      scoopSweep: { back: 0.04, lift: 0.09, lateral: 0 },
      stepCallouts: ["1. Snap Tail", "2. Tight Slide", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "slide-forward",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 36,
      idealCurlRange: [0.22, 0.64],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Keep your wrist square and fingers stacked cleanly while popping off your opposite stance.",
    cues: {
      plastic:
        "Sandpaper helps grip switch slides — focus on a straight middle snap without twisting your wrist.",
      wood: "Compress evenly into the foam before popping so the heavier maple doesn't wobble sideways.",
    },
  },

  // ==================== FLIPS ====================
  {
    id: "kickflip",
    category: "flips",
    name: "Kickflip",
    short: "KF",
    difficulty: 2,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 52, y: 104 },
      { finger: "M", x: 60, y: 270 },
    ],
    motion: ["M54 88 Q 62 62 96 46"],
    fingerVectors: [TAIL_POP_VECTOR, HEEL_FLICK_VECTOR],
    preview: {
      popAngleDeg: 32,
      flipDeg: 360,
      shuvDeg: 0,
      catchHeightNorm: 0.66,
      flickReach: { forward: 0.24, lift: 0.18, lateral: -0.14 },
      scoopSweep: { back: 0.05, lift: 0.16, lateral: 0.04 },
      stepCallouts: ["1. Snap Tail", "2. Heel Flick", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "heel-flick",
      expectedFlipDeg: 360,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 40,
      idealCurlRange: [0.2, 0.64],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Pop, slide your index up and flick off the toe-side corner of the nose.",
    cues: {
      plastic:
        "Quick snap on the plastic tail and flick briskly off the sandpaper pocket for a fast spin.",
      wood: "Use the foam tape traction to guide your index up the concave before flicking the nose pocket.",
    },
  },
  {
    id: "heelflip",
    category: "flips",
    name: "Heelflip",
    short: "HF",
    difficulty: 2,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 68, y: 104 },
      { finger: "M", x: 60, y: 270 },
    ],
    motion: ["M66 88 Q 58 62 24 46"],
    fingerVectors: [TAIL_POP_VECTOR, TOE_FLICK_VECTOR],
    preview: {
      popAngleDeg: 31,
      flipDeg: -360,
      shuvDeg: 0,
      catchHeightNorm: 0.65,
      flickReach: { forward: 0.22, lift: 0.19, lateral: 0.16 },
      scoopSweep: { back: 0.05, lift: 0.16, lateral: -0.04 },
      stepCallouts: ["1. Snap Tail", "2. Toe Flick", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "toe-flick",
      expectedFlipDeg: -360,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 42,
      idealCurlRange: [0.18, 0.62],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Pop, slide your index up and flick outward off the heel-side corner of the nose.",
    cues: {
      plastic:
        "Snap sharp and push your index cleanly off the sandpaper edge so it clears the front trucks.",
      wood: "Sink into the foam grip, pop steady, and drive straight through the heel pocket of the concave.",
    },
  },
  {
    id: "varial-kickflip",
    category: "flips",
    name: "Varial Kickflip",
    short: "VK",
    difficulty: 3,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 52, y: 106 },
      { finger: "M", x: 76, y: 270 },
    ],
    motion: ["M82 262 Q 58 292 34 268", "M54 90 Q 62 62 94 48"],
    fingerVectors: [
      {
        finger: "middle",
        label: "180 SCOOP",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.34, perp: 0.56 },
          { along: -0.82, perp: 0.14 },
        ],
      },
      HEEL_FLICK_VECTOR,
    ],
    preview: {
      popAngleDeg: 30,
      flipDeg: 360,
      shuvDeg: 180,
      catchHeightNorm: 0.65,
      flickReach: { forward: 0.22, lift: 0.18, lateral: -0.14 },
      scoopSweep: { back: 0.18, lift: 0.15, lateral: 0.14 },
      stepCallouts: ["1. Snap Tail", "2. Scoop & Flick", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "heel-flick",
      expectedFlipDeg: 360,
      expectedShuvDeg: 180,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 48,
      idealCurlRange: [0.22, 0.66],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Pair a gentle 180° backside scoop with a standard kickflip flick — keep it lighter than a Tre.",
    cues: {
      plastic:
        "Don't over-scoop the light plastic tail or it turns into a Tre — half-scoop + clean sandpaper flick.",
      wood: "Let the middle finger push a controlled 180° through the foam while index flicks the nose pocket.",
    },
  },
  {
    id: "varial-heelflip",
    category: "flips",
    name: "Varial Heelflip",
    short: "VH",
    difficulty: 3,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 68, y: 106 },
      { finger: "M", x: 46, y: 270 },
    ],
    motion: ["M42 260 Q 64 292 88 266", "M66 90 Q 58 62 24 48"],
    fingerVectors: [FS_SCOOP_VECTOR, TOE_FLICK_VECTOR],
    preview: {
      popAngleDeg: 30,
      flipDeg: -360,
      shuvDeg: -180,
      catchHeightNorm: 0.64,
      flickReach: { forward: 0.21, lift: 0.19, lateral: 0.16 },
      scoopSweep: { back: 0.18, lift: 0.15, lateral: -0.14 },
      stepCallouts: ["1. Snap Tail", "2. Push & Heel", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "toe-flick",
      expectedFlipDeg: -360,
      expectedShuvDeg: -180,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 50,
      idealCurlRange: [0.2, 0.64],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Push the tail forward for a frontside shuv while your index kicks out a clean heelflip.",
    cues: {
      plastic:
        "Snap forward on the plastic tail and clear your index quickly off the sandpaper so it doesn't tangle.",
      wood: "Use the wood deck's weight to sync the FS shove with a crisp outward toe kick.",
    },
  },
  {
    id: "hardflip",
    category: "flips",
    name: "Hardflip",
    short: "HD",
    difficulty: 4,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 52, y: 108 },
      { finger: "M", x: 46, y: 270 },
    ],
    motion: ["M42 260 Q 62 292 88 264", "M54 90 Q 68 58 92 40"],
    fingerVectors: [FS_SCOOP_VECTOR, HEEL_FLICK_VECTOR],
    preview: {
      popAngleDeg: 35,
      flipDeg: 360,
      shuvDeg: -180,
      catchHeightNorm: 0.72,
      flickReach: { forward: 0.26, lift: 0.24, lateral: -0.16 },
      scoopSweep: { back: 0.16, lift: 0.2, lateral: -0.14 },
      stepCallouts: ["1. Snap Tail", "2. FS Pop & Flip", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "heel-flick",
      expectedFlipDeg: 360,
      expectedShuvDeg: -180,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 55,
      idealCurlRange: [0.24, 0.7],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Snap the tail slightly forward (FS shuv) while snapping a steep vertical kickflip between your fingers.",
    cues: {
      plastic:
        "Pop high and pull your index clear right after flicking — plastic decks want to rocket vertically here.",
      wood: "Press deep into the foam tail pocket to launch the 5-ply vertically through the flip.",
    },
  },
  {
    id: "inward-heelflip",
    category: "flips",
    name: "Inward Heelflip",
    short: "IH",
    difficulty: 4,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 68, y: 108 },
      { finger: "M", x: 76, y: 270 },
    ],
    motion: ["M82 262 Q 58 292 34 268", "M66 90 Q 52 58 26 42"],
    fingerVectors: [BS_SCOOP_VECTOR, TOE_FLICK_VECTOR],
    preview: {
      popAngleDeg: 34,
      flipDeg: -360,
      shuvDeg: 180,
      catchHeightNorm: 0.7,
      flickReach: { forward: 0.23, lift: 0.22, lateral: 0.17 },
      scoopSweep: { back: 0.19, lift: 0.18, lateral: 0.15 },
      stepCallouts: ["1. Snap Tail", "2. BS Scoop & Heel", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "toe-flick",
      expectedFlipDeg: -360,
      expectedShuvDeg: 180,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 52,
      idealCurlRange: [0.22, 0.68],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Scoop the tail backward (BS shuv) while kicking your index forward off the heel corner.",
    cues: {
      plastic:
        "Lift your palm slightly higher on pop so the light plastic can tuck 180° under your fingers cleanly.",
      wood: "Sync the foam-grip scoop with a sharp diagonal heel kick so the board spins on one plane.",
    },
  },
  {
    id: "double-kickflip",
    category: "flips",
    name: "Double Kickflip",
    short: "2K",
    difficulty: 4,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 50, y: 106 },
      { finger: "M", x: 60, y: 272 },
    ],
    motion: ["M52 88 Q 64 56 104 40"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "FAST 2X FLICK",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.52, perp: -0.72 },
          { along: 1.18, perp: -0.25 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 35,
      flipDeg: 720,
      shuvDeg: 0,
      catchHeightNorm: 0.76,
      flickReach: { forward: 0.28, lift: 0.24, lateral: -0.18 },
      scoopSweep: { back: 0.05, lift: 0.24, lateral: 0.05 },
      stepCallouts: ["1. Snap Tail", "2. Whip 2X Flick", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "heel-flick",
      expectedFlipDeg: 720,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 45,
      idealCurlRange: [0.22, 0.66],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Pop extra high and whip a fast index flick across the nose pocket — hover until both spins finish.",
    cues: {
      plastic:
        "Sandpaper + light plastic spins fast — wait an extra beat at the top before dropping to catch.",
      wood: "Give the 5-ply maple maximum pop height and flick hard right at the concave corner for 720°.",
    },
  },

  // ==================== SCOOPS / SPINS ====================
  {
    id: "pop-shuvit",
    category: "spins",
    name: "Pop Shuvit",
    short: "PS",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 96 },
      { finger: "M", x: 78, y: 268 },
    ],
    motion: ["M86 260 Q 60 296 30 268"],
    fingerVectors: [
      BS_SCOOP_VECTOR,
      {
        finger: "index",
        label: "CATCH",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.08, perp: -0.48 },
          { along: 0.24, perp: -0.6 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 26,
      flipDeg: 0,
      shuvDeg: 180,
      catchHeightNorm: 0.54,
      flickReach: { forward: 0.04, lift: 0.2, lateral: 0 },
      scoopSweep: { back: 0.22, lift: 0.14, lateral: 0.16 },
      stepCallouts: ["1. Snap Tail", "2. 180° Scoop", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-bs",
      expectedFlipDeg: 0,
      expectedShuvDeg: 180,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 42,
      idealCurlRange: [0.18, 0.64],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Scoop the tail backward with your middle finger while lifting your index clear for the 180°.",
    cues: {
      plastic:
        "Light scoop on the tail — light plastic decks spin fast, so keep the 180° controlled.",
      wood: "Firm backward scoop with your middle finger to swing the 5-ply maple 180° under your hand.",
    },
  },
  {
    id: "fs-shuvit",
    category: "spins",
    name: "FS Shuvit",
    short: "FS",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 98 },
      { finger: "M", x: 44, y: 268 },
    ],
    motion: ["M36 260 Q 60 294 88 268"],
    fingerVectors: [
      FS_SCOOP_VECTOR,
      {
        finger: "index",
        label: "GUIDE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.1, perp: -0.46 },
          { along: 0.18, perp: -0.58 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 26,
      flipDeg: 0,
      shuvDeg: -180,
      catchHeightNorm: 0.54,
      flickReach: { forward: 0.04, lift: 0.2, lateral: 0 },
      scoopSweep: { back: 0.18, lift: 0.15, lateral: -0.16 },
      stepCallouts: ["1. Snap Tail", "2. FS Push", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-fs",
      expectedFlipDeg: 0,
      expectedShuvDeg: -180,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 45,
      idealCurlRange: [0.18, 0.64],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Pop down and push the tail forward (toward knuckles) so the board whips frontside 180°.",
    cues: {
      plastic:
        "Don't slide the index off the sandpaper — lift straight up and let the middle push FS 180°.",
      wood: "Press the foam tail pocket forward on the snap so the heavy deck stays flat during the 180°.",
    },
  },
  {
    id: "360-shuvit",
    category: "spins",
    name: "360 Shuvit",
    short: "3S",
    difficulty: 3,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 96 },
      { finger: "M", x: 80, y: 270 },
    ],
    motion: ["M88 260 Q 60 302 28 264"],
    fingerVectors: [
      {
        finger: "middle",
        label: "360 SCOOP",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.42, perp: 0.72 },
          { along: -1.12, perp: 0.24 },
        ],
      },
      {
        finger: "index",
        label: "HOVER",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.08, perp: -0.56 },
          { along: 0.18, perp: -0.7 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 27,
      flipDeg: 0,
      shuvDeg: 360,
      catchHeightNorm: 0.6,
      flickReach: { forward: 0.04, lift: 0.24, lateral: 0 },
      scoopSweep: { back: 0.28, lift: 0.17, lateral: 0.2 },
      stepCallouts: ["1. Snap Tail", "2. Deep 360° Scoop", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-bs",
      expectedFlipDeg: 0,
      expectedShuvDeg: 360,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 50,
      idealCurlRange: [0.2, 0.66],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Keep your index completely flat and elevated to prevent flip while whipping a full 360° tail scoop.",
    cues: {
      plastic:
        "Keep index tip off the sandpaper edge or it'll turn into a Tre Flip — pure middle-finger snap-scoop.",
      wood: "Wrap your middle finger onto the tail rail edge and whip smoothly through the foam.",
    },
  },
  {
    id: "tre-flip",
    category: "spins",
    name: "Tre Flip",
    short: "3F",
    difficulty: 4,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 50, y: 112 },
      { finger: "M", x: 80, y: 270 },
    ],
    motion: ["M88 262 Q 60 300 30 270", "M52 96 Q 60 66 94 48"],
    fingerVectors: [
      {
        finger: "middle",
        label: "POCKET SCOOP",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.34, perp: 0.68 },
          { along: -1.06, perp: 0.24 },
        ],
      },
      HEEL_FLICK_VECTOR,
    ],
    preview: {
      popAngleDeg: 30,
      flipDeg: 360,
      shuvDeg: 360,
      catchHeightNorm: 0.7,
      flickReach: { forward: 0.22, lift: 0.21, lateral: -0.16 },
      scoopSweep: { back: 0.24, lift: 0.18, lateral: 0.18 },
      stepCallouts: ["1. Snap Tail", "2. Flick & Scoop", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-bs",
      expectedFlipDeg: 360,
      expectedShuvDeg: 360,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 52,
      idealCurlRange: [0.22, 0.68],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Scoop the tail pocket hard for 360° while your index lightly flicks the kickflip.",
    cues: {
      plastic:
        "Sharp snap-scoop and fast sandpaper flick — stay high while the light plastic whips 360°.",
      wood: "Deep foam-grip tail scoop paired with a deliberate front-finger flick for a smooth 360° catch.",
    },
  },
  {
    id: "laser-flip",
    category: "spins",
    name: "Laser Flip",
    short: "LF",
    difficulty: 5,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 68, y: 110 },
      { finger: "M", x: 42, y: 270 },
    ],
    motion: ["M34 260 Q 62 300 94 268", "M66 96 Q 58 64 24 46"],
    fingerVectors: [FS_SCOOP_VECTOR, TOE_FLICK_VECTOR],
    preview: {
      popAngleDeg: 31,
      flipDeg: -360,
      shuvDeg: -360,
      catchHeightNorm: 0.74,
      flickReach: { forward: 0.24, lift: 0.23, lateral: 0.18 },
      scoopSweep: { back: 0.24, lift: 0.2, lateral: -0.18 },
      stepCallouts: ["1. Snap Tail", "2. FS 360 + Heel", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-fs",
      expectedFlipDeg: -360,
      expectedShuvDeg: -360,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 58,
      idealCurlRange: [0.22, 0.7],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Power a deep frontside 360° tail push while your index snaps a quick outward heelflip.",
    cues: {
      plastic:
        "Whip the plastic tail forward hard and clear both tips high — sandpaper snaps the heel rotation quick.",
      wood: "Sink into the foam pocket to torque the full FS 360° before pushing out the heelflip.",
    },
  },
  {
    id: "bigspin",
    category: "spins",
    name: "Bigspin",
    short: "BG",
    difficulty: 3,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 58, y: 98 },
      { finger: "M", x: 80, y: 270 },
    ],
    motion: ["M88 262 Q 60 300 28 266", "M60 98 Q 92 72 86 40"],
    fingerVectors: [
      BS_SCOOP_VECTOR,
      {
        finger: "index",
        label: "180 WRIST",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.24, perp: -0.6 },
          { along: -0.25, perp: -0.68 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 28,
      flipDeg: 0,
      shuvDeg: 360,
      catchHeightNorm: 0.64,
      flickReach: { forward: -0.18, lift: 0.22, lateral: 0.12 },
      scoopSweep: { back: 0.18, lift: 0.18, lateral: 0.14 },
      stepCallouts: ["1. Snap Tail", "2. 360° + Wrist 180°", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-bs",
      expectedFlipDeg: 0,
      expectedShuvDeg: 360,
      minWristTurnDeg: 115,
      maxWristTurnDeg: 230,
      idealCurlRange: [0.2, 0.68],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Scoop a 360° shuvit while turning your wrist 180° in the same direction to catch it switch.",
    cues: {
      plastic:
        "Don't out-turn the fast plastic spin — initiate the 360° scoop before rotating your wrist 180°.",
      wood: "Let the 5-ply rotate smoothly beneath your wrist as you smoothly turn 180° into the catch.",
    },
  },
  {
    id: "gazelle-flip",
    category: "spins",
    name: "Gazelle Flip",
    short: "GZ",
    difficulty: 5,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 50, y: 110 },
      { finger: "M", x: 82, y: 270 },
    ],
    motion: ["M90 260 Q 58 304 24 264", "M50 96 Q 94 60 88 34"],
    fingerVectors: [
      {
        finger: "middle",
        label: "540 SCOOP",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.44, perp: 0.72 },
          { along: -1.16, perp: 0.28 },
        ],
      },
      HEEL_FLICK_VECTOR,
    ],
    preview: {
      popAngleDeg: 32,
      flipDeg: 360,
      shuvDeg: 540,
      catchHeightNorm: 0.78,
      flickReach: { forward: 0.2, lift: 0.26, lateral: -0.18 },
      scoopSweep: { back: 0.26, lift: 0.22, lateral: 0.2 },
      stepCallouts: ["1. Snap Tail", "2. 540° Flip + 360°", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "scoop-bs",
      expectedFlipDeg: 360,
      expectedShuvDeg: 540,
      minWristTurnDeg: 180,
      maxWristTurnDeg: 390,
      idealCurlRange: [0.24, 0.72],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Unwind a massive 540° BS scoop + kickflip while whipping a full 360° wrist spin around the board.",
    cues: {
      plastic:
        "Pop high so the light deck clears 540°+flip while you whip a crisp 360° wrist rotation over top.",
      wood: "Pre-load the foam tail deeply; keep fingers relaxed during the 360° wrist turn so you catch bolts.",
    },
  },
  {
    id: "impossible",
    category: "spins",
    name: "Impossible",
    short: "IM",
    difficulty: 4,
    hasFlip: true,
    fingers: [
      { finger: "I", x: 60, y: 108 },
      { finger: "M", x: 62, y: 274 },
    ],
    motion: ["M62 256 C 24 210 24 140 62 110"],
    fingerVectors: [
      {
        finger: "middle",
        label: "VERTICAL WRAP",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.24, perp: -0.68 },
          { along: 0.16, perp: -0.82 },
        ],
      },
      {
        finger: "index",
        label: "CLEAR UP",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.12, perp: -0.6 },
          { along: 0.28, perp: -0.72 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 58,
      flipDeg: 360,
      shuvDeg: 0,
      catchHeightNorm: 0.72,
      flickReach: { forward: 0.08, lift: 0.28, lateral: 0 },
      scoopSweep: { back: -0.1, lift: 0.18, lateral: 0.06 },
      stepCallouts: ["1. Snap Tail", "2. Vertical Wrap", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "wrap-tail",
      expectedFlipDeg: 360,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 45,
      idealCurlRange: [0.3, 0.78],
      isGrind: false,
      targetCatchPitchDeg: 0,
    },
    cue: "Lift your index out of the way and curl your middle finger backward so the deck wraps vertically 360° around it.",
    cues: {
      plastic:
        "Curl your middle finger gently into the plastic pocket — light decks wrap super fast if you lift index cleanly.",
      wood: "Foam traction hugs your middle pad during the wrap; keep your index straight up until the tail swings back.",
    },
  },

  // ==================== GRINDS / SLIDES ====================
  {
    id: "50-50-grind",
    category: "grinds",
    name: "50-50 Grind",
    short: "50",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 118 },
      { finger: "M", x: 60, y: 268 },
    ],
    motion: ["M60 112 L60 72", "M44 160 L76 160"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "LEVEL LOCK",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.44, perp: -0.42 },
          { along: 0.9, perp: -0.05 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 30,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.56,
      flickReach: { forward: 0.14, lift: 0.06, lateral: 0 },
      scoopSweep: { back: 0.04, lift: 0.06, lateral: 0 },
      stepCallouts: ["1. Snap Tail", "2. Lock Trucks", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "grind-lock",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 32,
      idealCurlRange: [0.2, 0.62],
      isGrind: true,
      targetCatchPitchDeg: 0,
    },
    cue: "Ollie onto rail height, lock both trucks level for a smooth hold, then pop or drop clean.",
    cues: {
      plastic:
        "Plastic trucks slide slick — apply steady downward balance across both tips once locked.",
      wood: "Keep even pressure over the foam bolts during the lock hold so neither truck slips off the coping.",
    },
  },
  {
    id: "5-0-grind",
    category: "grinds",
    name: "5-0 Grind",
    short: "50+",
    difficulty: 3,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 118 },
      { finger: "M", x: 60, y: 274 },
    ],
    motion: ["M60 112 L60 74", "M60 264 L60 222"],
    fingerVectors: [
      {
        finger: "middle",
        label: "PRESS TAIL",
        tone: "hazard",
        points: [
          { along: 0, perp: 0 },
          { along: -0.2, perp: 0.44 },
          { along: -0.1, perp: -0.22 },
        ],
      },
      {
        finger: "index",
        label: "NOSE UP",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.35, perp: -0.58 },
          { along: 0.65, perp: -0.55 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 32,
      flipDeg: 0,
      shuvDeg: 0,
      catchHeightNorm: 0.58,
      flickReach: { forward: 0.1, lift: 0.16, lateral: 0 },
      scoopSweep: { back: 0.04, lift: 0.03, lateral: 0 },
      stepCallouts: ["1. Snap Tail", "2. Lock Back Truck", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "grind-lock",
      expectedFlipDeg: 0,
      expectedShuvDeg: 0,
      minWristTurnDeg: 0,
      maxWristTurnDeg: 35,
      idealCurlRange: [0.22, 0.65],
      isGrind: true,
      targetCatchPitchDeg: 18,
    },
    cue: "Pop onto the rail holding the nose pitched ~18°–24° high on just the back truck before dropping out.",
    cues: {
      plastic:
        "Don't let the plastic tail scrape drag you backward — hover the index lightly to hold the manual balance.",
      wood: "Sink your middle finger pad onto the foam tail pocket to balance the 5-0 cleanly.",
    },
  },
  {
    id: "boardslide",
    category: "grinds",
    name: "Boardslide",
    short: "BS",
    difficulty: 2,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 60, y: 118 },
      { finger: "M", x: 60, y: 268 },
    ],
    motion: ["M60 112 L60 72", "M40 160 Q 60 140 88 164"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "90° TURN",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.38, perp: -0.52 },
          { along: 0.15, perp: -0.68 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 28,
      flipDeg: 0,
      shuvDeg: 90,
      catchHeightNorm: 0.56,
      flickReach: { forward: 0.08, lift: 0.12, lateral: 0.14 },
      scoopSweep: { back: 0.08, lift: 0.12, lateral: -0.14 },
      stepCallouts: ["1. Snap Tail", "2. Turn 90° & Slide", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "grind-lock",
      expectedFlipDeg: 0,
      expectedShuvDeg: 90,
      minWristTurnDeg: 55,
      maxWristTurnDeg: 130,
      idealCurlRange: [0.2, 0.65],
      isGrind: true,
      targetCatchPitchDeg: 0,
    },
    cue: "Ollie cleanly and rotate your wrist 90° so the middle of the deck locks perpendicular across the rail.",
    cues: {
      plastic:
        "Slick plastic slides super fast — rotate a crisp 90° wrist turn and counter-twist back straight on exit.",
      wood: "Keep fingers centered over the middle of the foam tape while holding the 90° slide angle.",
    },
  },
  {
    id: "smith-grind",
    category: "grinds",
    name: "Smith Grind",
    short: "SM",
    difficulty: 4,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 64, y: 110 },
      { finger: "M", x: 56, y: 270 },
    ],
    motion: ["M60 104 L76 64", "M56 262 L44 230"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "DIP NOSE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.48, perp: -0.42 },
          { along: 0.88, perp: 0.12 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 32,
      flipDeg: 0,
      shuvDeg: 32,
      catchHeightNorm: 0.58,
      flickReach: { forward: 0.16, lift: 0.02, lateral: 0.1 },
      scoopSweep: { back: 0.06, lift: 0.08, lateral: -0.06 },
      stepCallouts: ["1. Snap Tail", "2. Pinch & Dip Nose", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "grind-lock",
      expectedFlipDeg: 0,
      expectedShuvDeg: 35,
      minWristTurnDeg: 18,
      maxWristTurnDeg: 68,
      idealCurlRange: [0.24, 0.68],
      isGrind: true,
      targetCatchPitchDeg: -14,
    },
    cue: "Pop into a slight angled back-truck lock while dipping the nose down past the rail edge.",
    cues: {
      plastic:
        "Pinch your middle tip lightly on the back heel side so the slick plastic truck doesn't bounce off.",
      wood: "Use foam grip friction with your index tip to hold that tweaked nose-down pinch through the slide.",
    },
  },
  {
    id: "crooked-grind",
    category: "grinds",
    name: "Crooked Grind",
    short: "CK",
    difficulty: 4,
    hasFlip: false,
    fingers: [
      { finger: "I", x: 54, y: 92 },
      { finger: "M", x: 64, y: 266 },
    ],
    motion: ["M54 88 L36 52", "M64 256 L78 220"],
    fingerVectors: [
      TAIL_POP_VECTOR,
      {
        finger: "index",
        label: "PINCH NOSE",
        tone: "primary",
        points: [
          { along: 0, perp: 0 },
          { along: 0.5, perp: -0.36 },
          { along: 0.85, perp: 0.14 },
        ],
      },
    ],
    preview: {
      popAngleDeg: 31,
      flipDeg: 0,
      shuvDeg: -35,
      catchHeightNorm: 0.58,
      flickReach: { forward: 0.18, lift: 0.02, lateral: -0.1 },
      scoopSweep: { back: 0.05, lift: 0.12, lateral: 0.08 },
      stepCallouts: ["1. Snap Tail", "2. Pinch Crook", "3. Hover & Catch"],
    },
    signature: {
      popOrigin: "tail",
      flickKind: "grind-lock",
      expectedFlipDeg: 0,
      expectedShuvDeg: -35,
      minWristTurnDeg: 18,
      maxWristTurnDeg: 68,
      idealCurlRange: [0.24, 0.7],
      isGrind: true,
      targetCatchPitchDeg: -16,
    },
    cue: "Ollie onto the front truck slightly tweaked nose-down, locking your index into the nose pinch.",
    cues: {
      plastic:
        "Press lightly into the sandpaper nose pocket so the slick truck stays tweaked without slipping into 50-50.",
      wood: "Sink your index pad into the foam nose kick to lock the crooked pinch, then nudge forward to exit.",
    },
  },
];

type TechniqueNotes = NonNullable<Trick["technique"]>;

/** Hand-authored notes for the original core set; the expanded recipes carry their own notes. */
const BASE_TECHNIQUE_NOTES: Partial<Record<TrickId, TechniqueNotes>> = {
  ollie: {
    setup: "Place the middle pad in the tail pocket and the index just behind the front bolts. Keep both fingers softly arched and the wrist aligned with the board's travel line.",
    execution: "Drive the tail into the surface with the middle finger, then let the index travel up the grip toward the nose to level the deck. Do not lift both fingers straight up together.",
    timing: "The tail snap starts the movement. Begin the index slide as the nose rises; sliding before the tail contacts the surface bleeds off the pop.",
    catch: "Meet the deck over the bolts with both pads, then let the fingers flex to absorb the landing. Keep the deck level through touchdown.",
    commonFaults: ["Index slides before the tail snap", "Front finger stops short and leaves a rocket angle", "Catch lands on the kicks instead of the bolts"],
  },
  "boned-ollie": {
    setup: "Use a normal tail-pop stance, but keep the index close enough to the nose pocket to extend through it. Start with the middle finger loaded and the index relaxed.",
    execution: "Pop steeply, then drive the index past the front bolts while lifting/tucking the middle finger. The nose dips as the tail rises into the boned-out shape.",
    timing: "Separate the tail snap from the extension by a fraction of the rise. Extending before takeoff produces a dragged, low ollie; extending after the apex loses the tweak.",
    catch: "Bring the middle pad back over the rear bolts and level the nose before both pads settle. Absorb the landing rather than pinning the deck flat.",
    commonFaults: ["Front finger pushes before the tail has snapped", "Index stops at the front bolts so the deck stays rocket-shaped", "Middle finger never lifts clear enough to show the tweak"],
  },
  nollie: {
    setup: "Move the index pad to the nose pocket and keep the middle pad near the rear half of the deck. Let the index carry the initial load without flattening the wrist.",
    execution: "Snap the nose down with the index, then guide the rising deck back toward level with the middle finger moving toward the tail. Keep the hand following the board rather than reaching after it.",
    timing: "The nose snap must happen first. Start the middle-finger guide as the tail lifts; an early pull cancels the nose rebound.",
    catch: "Catch over both truck areas once the deck levels, with the index returning toward the nose bolts and the middle over the rear bolts.",
    commonFaults: ["Middle finger supplies a tail-pop instead of an index nose-pop", "Nose is loaded too far inside to create a clean snap", "Middle finger drags early and pulls the board off line"],
  },
  "fakie-ollie": {
    setup: "Use your comfortable tail-pop finger placement, but set the board travelling backward. Keep the wrist steady so the reverse travel direction does not rotate the hand off-axis.",
    execution: "Snap the tail while maintaining backward travel, then guide the nose level with the index. Think of the same ollie mechanics moving in the opposite direction.",
    timing: "Pop as the board moves backward, then level during the first part of the rise. Do not add an unnecessary scoop to compensate for the reversed travel.",
    catch: "Catch square over the bolts and keep the backward travel line through touchdown; avoid reaching forward and stopping the board in mid-air.",
    commonFaults: ["Hand turns back to its regular travel direction", "Extra scoop creates an unintended shuvit", "Index chases the nose and catches behind the deck"],
  },
  "switch-ollie": {
    setup: "Set your fingers in the switch stance you use consistently, mirrored from your normal comfortable placement. Keep the pop finger in the intended tail pocket and wrist square to the deck.",
    execution: "Make a clean tail snap with the switch lead finger, then guide the nose level with the other pad. Prioritise a straight vertical path before adding height.",
    timing: "Keep the pop-to-slide cadence identical to a regular ollie, but execute it with the switch finger roles. Rushing the front-finger slide makes the board drift.",
    catch: "Return both pads to their switch bolt positions and catch level. Follow the deck's centre rather than moving the hand back to your regular stance.",
    commonFaults: ["Default stance finger placement leaks into the switch attempt", "Front pad slides before the tail has snapped", "Hand follows its normal path and misses the switch catch"],
  },
  kickflip: {
    setup: "Set the middle finger in the tail pocket and the index near the front bolts, slightly toward the heel-side edge. Keep the index pad light enough to flick rather than pin the deck.",
    execution: "Pop first, then brush the index diagonally off the heel-side nose corner to create one long-axis rotation. Keep the middle finger from clamping the deck during the flick.",
    timing: "Let the tail snap initiate the rise, then flick as the nose comes up. A short, clean brush is more repeatable than a hard upward jab.",
    catch: "Watch the grip return, then catch over the bolts after the full 360°. Meet the deck with relaxed pads and absorb the landing evenly.",
    commonFaults: ["Flick travels upward instead of out through the edge", "Index drags before the tail has popped", "Fingers drop before the grip completes its return"],
  },
  heelflip: {
    setup: "Use the tail-pop stance with the index positioned toward the toe-side edge near the front bolts. Keep the middle finger centred in the tail pocket.",
    execution: "Pop, then brush the index outward through the toe-side edge to rotate the deck the opposite way from a kickflip. Keep the wrist from rolling with the flick.",
    timing: "Start the toe-side brush as the nose rises after the tail snap. Too much early sideways pressure makes the deck drift before it flips.",
    catch: "Let the deck complete its 360° return to grip side up, then meet both bolt zones. Keep the index from reaching down while the board is still edge-on.",
    commonFaults: ["Flick comes from the kickflip/heel side", "Board travels sideways from an oversized outward push", "Catch begins before the grip side faces up"],
  },
  "varial-kickflip": {
    setup: "Keep the kickflip index position and place the middle pad deep enough in the tail pocket to scoop. Leave a clear path between the two actions so the flick is not blocked.",
    execution: "Combine a backside 180° tail scoop with a single kickflip flick. The scoop turns the board while the index supplies the long-axis flip; neither action should dominate the other.",
    timing: "Initiate the scoop with the tail pop and add the index flick through the rising phase. If the scoop finishes too early, the board spins away before the kickflip completes.",
    catch: "Track the nose through the 180° shuv and catch grip-side up after the full flip. Centre both pads over the bolts before touchdown.",
    commonFaults: ["Scoop is too strong and the board over-rotates", "Kickflip flick is muted by a tight tail scoop", "Catch is made after the shuv but before the flip finishes"],
  },
  "varial-heelflip": {
    setup: "Place the index at the toe-side flick pocket and the middle finger deep in the tail. Keep the wrist neutral so the frontside scoop does not become an unintended wrist spin.",
    execution: "Pair a frontside 180° scoop with a heelflip flick. Let the middle finger move the board around its vertical axis while the index brushes the toe-side edge.",
    timing: "Start the frontside scoop with the pop and flick through the first part of the rise. Keep both impulses continuous rather than adding a second corrective jab.",
    catch: "Wait for the heelflip to finish with grip side up, then catch over the bolts while the deck completes its frontside half-turn.",
    commonFaults: ["Backside scoop direction is used by habit", "Index flick is too weak to complete the heelflip", "Wrist twists independently and pulls the board off-axis"],
  },
  hardflip: {
    setup: "Load the middle finger in the tail pocket and place the index near the kickflip flick point. Keep the index more centred than for a flat kickflip so it can flick through the rising deck.",
    execution: "Drive a frontside 180° scoop while the index adds a steep kickflip. The scoop should pass between the fingers; avoid pinching the deck edge with the index.",
    timing: "The pop and frontside scoop begin together; the kickflip flick follows immediately as the nose rises. A flick that starts before the pop tends to produce a low sideways kickflip.",
    catch: "Follow the nose through the frontside half-turn and catch only when the kickflip rotation is complete. Bring both pads down together over the bolt zones.",
    commonFaults: ["Scoop direction is reversed", "Kickflip flick is too flat and becomes a varial-like rotation", "Index blocks the deck as it passes between the fingers"],
  },
  "inward-heelflip": {
    setup: "Set the index on the toe-side heelflip pocket and the middle pad deep in the tail for a backside scoop. Keep the index free to brush outward.",
    execution: "Combine a backside 180° scoop with a heelflip flick. Let the tail rotate under the hand while the index creates the opposite long-axis flip.",
    timing: "The backside scoop begins with the tail snap; apply the heelflip brush as the board rises. Keep the two inputs linked, not separated by a pause.",
    catch: "Wait for the toe-side flip to finish and the nose to complete its backside half-turn. Catch both bolt areas with the deck level.",
    commonFaults: ["Frontside scoop is used instead of backside", "Heelflip flick turns into a kickflip", "Catch is early while the board is still edge-on"],
  },
  "double-kickflip": {
    setup: "Use your regular kickflip placement, but keep a little extra clearance above the deck and a lighter, quicker index contact. Avoid loading extra pressure into the middle finger.",
    execution: "Snap the tail, then flick cleanly through the heel edge with enough follow-through for two full rotations. Do not keep dragging the index across the deck after release.",
    timing: "The extra rotation needs a clean early flick and a patient catch. Let the board rise and finish the second rotation; dipping the fingers at the first grip-side flash cuts it short.",
    catch: "Spot the grip returning after 720° and catch over the bolts. Keep the pads hovering rather than chasing the deck during the second rotation.",
    commonFaults: ["Flick is too soft for the second rotation", "Finger stays in contact and stalls the spin", "Catch is made on the first grip-side pass"],
  },
  "pop-shuvit": {
    setup: "Set the middle finger in the tail pocket with room to sweep backward and slightly across the deck. Keep the index hovering near the front bolts to stop an accidental flip.",
    execution: "Pop while scooping the tail backside through a half-turn. Keep the index high and quiet; the middle finger supplies the shuvit rather than a long-axis flick.",
    timing: "The scoop starts with the pop and continues in one short arc. Pulling too early drags the tail along the table; adding a late wrist twist sends the nose off line.",
    catch: "Track the nose through 180° and catch once the grip side is still facing up. Place the index and middle pads back over the bolt areas.",
    commonFaults: ["Index adds an accidental kickflip", "Tail drags instead of snapping clear", "Board rotates past 180° before the catch"],
  },
  "fs-shuvit": {
    setup: "Place the middle pad in the tail pocket and angle the scoop path toward the frontside direction. Keep the index lightly above the front bolts to keep the deck flat.",
    execution: "Pop and push the tail frontside through a 180° horizontal turn. Keep the wrist square and let the tail sweep underneath the palm.",
    timing: "Begin the frontside sweep at tail impact and release as the board clears the surface. A late shove after the pop usually creates sideways drift without enough rotation.",
    catch: "Follow the deck through the half-turn, then catch the grip side up with both pads near the bolts and the nose aligned to the new travel direction.",
    commonFaults: ["Backside scoop direction is used", "Index presses down and blocks the spin", "The hand stops while the deck continues rotating"],
  },
  "360-shuvit": {
    setup: "Load the tail with the middle finger and hold the index slightly higher than for a standard shuvit. The index should guide the deck without flicking its edge.",
    execution: "Use a longer, stronger backside tail scoop to create a complete 360° horizontal rotation while keeping the long axis level.",
    timing: "Sweep through the full rotation from takeoff rather than pulsing the tail twice. Keep the index clear until the nose returns to its starting direction.",
    catch: "Wait for the full 360° and catch grip-side up over the bolts. A clean catch happens after the nose has completed its full circle, not at the halfway point.",
    commonFaults: ["Scoop only reaches 180°", "Index adds unintended flip rotation", "Second corrective push over-rotates the board"],
  },
  "tre-flip": {
    setup: "Set a deep backside scoop with the middle finger and a light kickflip flick position for the index. Keep the front pad loose so the deck can travel through the wrap.",
    execution: "Combine one backside 360° tail scoop with a single kickflip flick. The middle finger drives the full shuv rotation while the index gives the deck its long-axis flip.",
    timing: "Start the scoop on the pop and add the flick as the board rises. Keep the flick compact; a hard kickflip jab can fight the 360° scoop path.",
    catch: "Track the nose through the full 360° and wait for the grip to return after the kickflip. Catch both bolt areas only once the deck is level.",
    commonFaults: ["Scoop stalls before the full 360°", "Index flick is too strong and throws the deck out of the wrap", "Fingers drop on the first grip-side glimpse"],
  },
  "laser-flip": {
    setup: "Set the middle finger for a deep frontside tail scoop and the index at the toe-side heelflip flick pocket. Keep wrist movement smooth and controlled.",
    execution: "Drive a frontside 360° scoop while the index supplies a heelflip. Let the tail travel around the hand; do not force the full rotation with a late forearm twist.",
    timing: "Begin the frontside scoop with the pop and apply the heelflip brush on the rise. Keep the flick and scoop moving as one continuous action.",
    catch: "Wait for both the full frontside 360° and the heelflip to finish. Catch grip-side up over the bolts with the wrist returning to neutral.",
    commonFaults: ["Backside scoop is used from muscle memory", "Heelflip flick turns into a kickflip", "Wrist over-rotates and pulls the catch off-centre"],
  },
  bigspin: {
    setup: "Set the middle finger deep in the backside scoop pocket and keep the index hovering above the front bolts. Plan the wrist/hand follow-through before popping.",
    execution: "Scoop the board through a backside 360° while the hand/wrist follows through a 180° body-style turn. The deck and hand do not rotate by the same amount.",
    timing: "Start the 360° board scoop on takeoff and let the wrist turn through the middle of the arc. Turning the wrist before the board has cleared the surface can mute the pop.",
    catch: "Spot the deck after the full board rotation and receive it in the changed stance. Re-centre the pads over the bolts instead of untwisting at the last instant.",
    commonFaults: ["Board only rotates 180°", "Wrist turns 360° with the deck instead of following 180°", "Catch is made in the original stance and knocks the board away"],
  },
  "gazelle-flip": {
    setup: "Use a deep backside scoop and a controlled kickflip index position. Keep enough room around the board for the large rotation and avoid a cramped wrist start.",
    execution: "Combine a 540° backside scoop with a kickflip while the wrist/hand follows through the large rotation. Keep the finger pads clear until the deck comes back under the hand.",
    timing: "Initiate the scoop with the pop; the kickflip brush should happen early enough to finish before the catch. Let the board travel rather than chasing it with repeated corrections.",
    catch: "Track the nose through the extended spin and catch only after the flip and horizontal rotation have resolved. Keep the wrist relaxed as the pads reconnect.",
    commonFaults: ["Scoop ends at 360° instead of 540°", "Kickflip finishes after the catch begins", "Wrist chases the deck and pulls the hand off its landing line"],
  },
  impossible: {
    setup: "Set the middle finger in the tail pocket with a curled, wrapping path available; lift the index clear of the deck. Keep the middle pad hooked rather than flat.",
    execution: "Pop and curl the middle finger so the deck wraps vertically around it. The board should travel around the finger, not perform a flat kickflip under two fingers.",
    timing: "The wrap begins as the tail snaps upward. Maintain the curl through the rotation, then open the finger as the deck completes the loop.",
    catch: "Bring the index back over the nose and meet the returning deck with the middle finger near the tail. Absorb the catch without clamping during the final part of the wrap.",
    commonFaults: ["Index stays on the deck and blocks the wrap", "Middle finger pushes flat instead of curling around the tail", "Finger opens before the board completes the loop"],
  },
  "50-50-grind": {
    setup: "Approach parallel to the rail/ledge with both finger pads balanced over the truck areas. Aim the centre line of the deck directly above the obstacle.",
    execution: "Ollie to obstacle height and land both trucks on the rail. Keep the deck parallel and distribute pressure between index and middle while travelling along the obstacle.",
    timing: "Finish the pop before the trucks meet the rail. Hold a stable lock for a beat; an early truck contact while the board is still rising is a collision, not a grind.",
    catch: "Keep both trucks engaged until the exit point, then lift or drop with the deck level. Re-centre the fingers over the bolts for the landing.",
    commonFaults: ["Only one truck reaches the rail", "Approach angle is not parallel", "Finger pressure shifts to one end and slips off the obstacle"],
  },
  "5-0-grind": {
    setup: "Approach parallel with the middle finger over the rear truck and the index light near the nose. Plan to carry the rear truck as the only locked contact point.",
    execution: "Pop to rail height, lock the rear truck and lift the nose into a controlled angle. Keep the tail/rear truck centred on the rail rather than letting the deck flatten into a 50-50.",
    timing: "Raise the nose as the rear truck makes contact. If the nose angle is added after the lock, the board tends to bounce or slip off.",
    catch: "Hold the rear-truck lock through the slide, then level the nose and exit cleanly. Bring both pads back over the bolts before landing.",
    commonFaults: ["Front truck touches down and turns it into a 50-50", "Nose rises too far and the rear truck slips", "Deck levels before the exit and loses the lock"],
  },
  boardslide: {
    setup: "Approach the rail at a controlled angle with fingers centred over the deck. Leave room for a 90° board turn without the hand crossing the obstacle too early.",
    execution: "Pop above the rail, rotate the deck so its middle sits perpendicular across the rail, then balance pressure across the deck while sliding.",
    timing: "Complete the 90° turn before the deck contacts the rail. A late turn lands crooked; an early turn can clip the rail on the way up.",
    catch: "Keep the deck centred across the rail, then unwind or pop out at the end. Catch the board level as it clears the obstacle.",
    commonFaults: ["Deck remains parallel instead of perpendicular", "Rotation finishes after rail contact", "Fingers move to one end and the board slips off"],
  },
  "smith-grind": {
    setup: "Approach parallel with the rear truck lined up to lock and the index ready to guide the nose. Keep the board's travel line steady.",
    execution: "Pop into a rear-truck lock while the nose dips down past the rail edge. The front end should be angled away from the coping rather than settling into a flat 50-50.",
    timing: "Set the rear truck first, then let the nose dip as the lock stabilises. Dipping before contact usually turns the approach into a nose collision.",
    catch: "Maintain the rear-truck contact through the slide, then lift the nose and guide the deck out. Re-centre both pads over the bolts for touchdown.",
    commonFaults: ["Rear truck never establishes a stable lock", "Nose dips too early and clips the rail", "Board straightens into a 50-50 during the slide"],
  },
  "crooked-grind": {
    setup: "Approach parallel with the index set toward the nose pocket. Aim the front truck to lock while leaving the deck slightly angled across the ledge.",
    execution: "Pop onto the front truck with a nose-down crooked pinch. Keep the index pressure over the nose pocket while the rear end trails clear of the edge.",
    timing: "Complete the small angle and front-truck lock as the board reaches obstacle height. Too much rotation before contact turns it into a boardslide-like lock.",
    catch: "Hold the front-truck pinch along the ledge, then release by lifting the nose slightly and guiding the deck back level. Catch over the bolts after clearing the edge.",
    commonFaults: ["Both trucks land flat in a 50-50", "Board rotates too far and becomes a boardslide", "Index pressure misses the nose pocket and the front truck slips off"],
  },
};

export const TRICKS: Trick[] = [...BASE_TRICKS, ...ADDITIONAL_TRICKS].map((trick) => {
  const technique = trick.technique ?? BASE_TECHNIQUE_NOTES[trick.id];
  if (!technique) throw new Error(`Missing technique notes for ${trick.id}`);
  return { ...trick, technique };
});

export const DEFAULT_TRICK: TrickId = "ollie";

export function getTrick(id: TrickId): Trick {
  return TRICKS.find((t) => t.id === id) ?? TRICKS[0]!;
}

export function getTricksByCategory(category: TrickCategory): Trick[] {
  return TRICKS.filter((t) => t.category === category);
}

export function getTrickCue(trick: Trick, setup?: DeckSetupId): string {
  return setup ? trick.cues[setup] : trick.cue;
}
