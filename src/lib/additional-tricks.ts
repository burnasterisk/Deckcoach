import type { FingerVectorGuide, Trick, TrickCategory, TrickId } from "./tricks";

interface TrickRecipe {
  id: TrickId;
  name: string;
  short: string;
  category: TrickCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  popOrigin?: "tail" | "nose";
  flickKind:
    | "slide-forward"
    | "slide-back"
    | "heel-flick"
    | "toe-flick"
    | "scoop-bs"
    | "scoop-fs"
    | "wrap-tail"
    | "grind-lock";
  flip: number;
  shuv: number;
  wrist?: number;
  targetPitch?: number;
  curl?: readonly [number, number];
  cue: string;
  plastic: string;
  wood: string;
  steps: readonly [string, string, string];
  faults: readonly [string, string, string];
}

const VECTORS: Record<TrickRecipe["flickKind"], FingerVectorGuide> = {
  "slide-forward": {
    finger: "index",
    label: "DRIVE NOSE",
    tone: "primary",
    points: [{ along: 0, perp: 0 }, { along: 0.42, perp: -0.28 }, { along: 0.92, perp: -0.16 }],
  },
  "slide-back": {
    finger: "index",
    label: "PULL BACK",
    tone: "primary",
    points: [{ along: 0, perp: 0 }, { along: -0.38, perp: -0.24 }, { along: -0.9, perp: -0.12 }],
  },
  "heel-flick": {
    finger: "index",
    label: "HEEL EDGE",
    tone: "primary",
    points: [{ along: 0, perp: 0 }, { along: 0.44, perp: -0.6 }, { along: 1.02, perp: -0.26 }],
  },
  "toe-flick": {
    finger: "index",
    label: "TOE EDGE",
    tone: "primary",
    points: [{ along: 0, perp: 0 }, { along: 0.42, perp: 0.38 }, { along: 1.0, perp: -0.5 }],
  },
  "scoop-bs": {
    finger: "middle",
    label: "BS SCOOP",
    tone: "hazard",
    points: [{ along: 0, perp: 0 }, { along: -0.4, perp: 0.62 }, { along: -1.0, perp: 0.18 }],
  },
  "scoop-fs": {
    finger: "middle",
    label: "FS SCOOP",
    tone: "hazard",
    points: [{ along: 0, perp: 0 }, { along: -0.36, perp: -0.52 }, { along: -0.96, perp: -0.2 }],
  },
  "wrap-tail": {
    finger: "middle",
    label: "WRAP TAIL",
    tone: "primary",
    points: [{ along: 0, perp: 0 }, { along: -0.48, perp: 0.58 }, { along: -0.82, perp: -0.5 }],
  },
  "grind-lock": {
    finger: "index",
    label: "LOCK TRUCK",
    tone: "primary",
    points: [{ along: 0, perp: 0 }, { along: 0.35, perp: -0.24 }, { along: 0.72, perp: 0.06 }],
  },
};

const TAIL_POP: FingerVectorGuide = {
  finger: "middle",
  label: "TAIL SNAP",
  tone: "hazard",
  points: [{ along: 0, perp: 0 }, { along: -0.2, perp: 0.44 }, { along: -0.1, perp: -0.5 }],
};
const NOSE_POP: FingerVectorGuide = {
  finger: "index",
  label: "NOSE SNAP",
  tone: "hazard",
  points: [{ along: 0, perp: 0 }, { along: 0.22, perp: 0.44 }, { along: 0.1, perp: -0.5 }],
};

function makeTrick(recipe: TrickRecipe): Trick {
  const grind = recipe.category === "grinds";
  const popOrigin = recipe.popOrigin ?? "tail";
  const flip = recipe.flip;
  const shuv = recipe.shuv;
  const flick = VECTORS[recipe.flickKind];
  const flickEndAlong = flick.points[2]?.along ?? 0;
  const isFlip = Math.abs(flip) >= 180;
  const catchHeight = grind ? 0.46 : 0.58 + Math.min(0.16, recipe.difficulty * 0.018);
  const reach = recipe.flickKind === "scoop-bs" || recipe.flickKind === "scoop-fs" || recipe.flickKind === "wrap-tail";

  return {
    id: recipe.id,
    category: recipe.category,
    name: recipe.name,
    short: recipe.short,
    difficulty: recipe.difficulty,
    hasFlip: isFlip,
    fingers: [
      { finger: "I", x: 60, y: popOrigin === "nose" ? 112 : 126 },
      { finger: "M", x: 60, y: popOrigin === "nose" ? 264 : 270 },
    ],
    motion: grind
      ? ["M60 105 L60 62", `M60 245 L${shuv < 0 ? 35 : 85} 210`]
      : [popOrigin === "nose" ? "M60 125 L60 70" : "M60 265 L60 225", `M60 130 L${flickEndAlong < 0 ? 30 : 90} 75`],
    fingerVectors: [popOrigin === "nose" ? NOSE_POP : TAIL_POP, flick],
    preview: {
      popAngleDeg: grind ? 27 : popOrigin === "nose" ? -30 : 34,
      flipDeg: flip,
      shuvDeg: shuv,
      catchHeightNorm: catchHeight,
      flickReach: {
        forward: recipe.flickKind === "heel-flick" || recipe.flickKind === "toe-flick" ? 0.22 : 0.1,
        lift: isFlip ? 0.18 : 0.08,
        lateral: shuv === 0 ? 0 : Math.sign(shuv) * 0.16,
      },
      scoopSweep: {
        back: reach ? 0.2 : 0.06,
        lift: reach ? 0.15 : 0.08,
        lateral: shuv === 0 ? 0 : Math.sign(shuv) * 0.12,
      },
      stepCallouts: recipe.steps,
    },
    signature: {
      popOrigin,
      flickKind: recipe.flickKind,
      expectedFlipDeg: flip,
      expectedShuvDeg: shuv,
      minWristTurnDeg: recipe.wrist ?? (Math.abs(shuv) >= 360 ? 22 : grind ? 14 : 0),
      maxWristTurnDeg: grind ? 75 : 58,
      idealCurlRange: recipe.curl ?? (grind ? [0.22, 0.68] : [0.2, 0.64]),
      isGrind: grind,
      targetCatchPitchDeg: recipe.targetPitch ?? (grind ? -8 : 0),
    },
    cue: recipe.cue,
    cues: {
      plastic: recipe.plastic,
      wood: recipe.wood,
    },
    technique: {
      setup: popOrigin === "nose"
        ? "Set the index pad over the nose pocket and keep the middle finger light until the nose snap."
        : "Set the middle pad into the tail pocket; keep the index pad near the front bolts without dragging early.",
      execution: recipe.cue,
      timing: recipe.flickKind === "grind-lock"
        ? "Complete the pop and any rotation before loading the obstacle. A lock before the board clears the edge becomes a collision, not a grind."
        : recipe.name.toLowerCase().startsWith("late ")
          ? "Separate the pop from the flick: let the deck rise to the apex, then initiate the second action while it is still travelling upward or just beginning to level."
          : "Create the pop first, then apply the flick or scoop through one continuous impulse. Avoid a second corrective jab after release.",
      catch: grind
        ? "Spot the intended truck/deck contact, lower the fingers evenly, and keep the travel line parallel to the obstacle until the exit."
        : "Keep both finger pads above the board through the last required rotation; catch over the bolts with the pads slightly flexed to absorb the landing.",
      commonFaults: recipe.faults,
    },
  };
}

/**
 * Additional pop-based fingerboard tricks. The catalogue intentionally focuses on
 * tricks the current hand/board pipeline can attempt to analyse; manuals and static
 * stalls need a separate balance-state detector and are not misrepresented as tracked.
 */
const RECIPES: TrickRecipe[] = [
  // Nollie / fakie / switch flip variations
  { id: "nollie-kickflip", name: "Nollie Kickflip", short: "NKF", category: "flips", difficulty: 4, popOrigin: "nose", flickKind: "heel-flick", flip: 360, shuv: 0, cue: "Load the nose with your index, snap it down, then flick the heel edge as the tail lifts.", plastic: "Plastic noses rebound quickly: keep the index planted until the nose snap is visible, then flick once.", wood: "Let the wood nose compress into the surface, then brush the heel pocket without dragging the whole deck forward.", steps: ["1. Load Nose", "2. Heel Flick", "3. Catch Bolts"], faults: ["Tail-pop instead of nose-pop", "Flick before nose snap", "Catch before full rotation"] },
  { id: "fakie-kickflip", name: "Fakie Kickflip", short: "FKF", category: "flips", difficulty: 3, flickKind: "heel-flick", flip: 360, shuv: 0, cue: "Keep your fakie stance compact; pop from the trailing tail and flick across the heel pocket without chasing the nose.", plastic: "Use a short, quick flick on plastic so the deck does not shoot away.", wood: "Use the foam grip to guide a longer controlled brush; keep the wrist square through the catch.", steps: ["1. Fakie Set", "2. Tail Pop + Flick", "3. Catch Level"], faults: ["Stance drifting out of fakie", "Flick too far off the corner", "Landing behind the deck"] },
  { id: "switch-kickflip", name: "Switch Kickflip", short: "SKF", category: "flips", difficulty: 5, flickKind: "toe-flick", flip: 360, shuv: 0, cue: "Mirror your usual kickflip mechanics: switch pop pocket, front-finger toe-side flick, then move the hand with the deck rather than reaching after it.", plastic: "Plastic rewards a decisive compact flick; reduce sideways pressure after release.", wood: "Use a smooth toe-side brush and keep pressure through the grip rather than stabbing at the deck.", steps: ["1. Switch Pocket", "2. Toe-side Flick", "3. Track & Catch"], faults: ["Default-stance finger placement", "Flick traveling across deck", "Hand not following deck"] },
  { id: "nollie-heelflip", name: "Nollie Heelflip", short: "NHF", category: "flips", difficulty: 5, popOrigin: "nose", flickKind: "toe-flick", flip: -360, shuv: 0, cue: "Snap the nose first, then flick toward the toe edge; keep the middle finger light so it does not mute the tail rise.", plastic: "Use a brisk toe-edge flick and release pressure immediately after the board clears.", wood: "Let the nose load, then brush outward with a clean wrist line instead of twisting your whole hand.", steps: ["1. Nose Snap", "2. Toe Flick", "3. Wait & Catch"], faults: ["Tail-driven pop", "Heel-side flick", "Middle finger pinning deck"] },
  { id: "fakie-heelflip", name: "Fakie Heelflip", short: "FHF", category: "flips", difficulty: 4, flickKind: "toe-flick", flip: -360, shuv: 0, cue: "Start fakie with the index just inside the toe edge, pop sharply and brush outward so the deck rotates without drifting away.", plastic: "Keep the flick short; plastic can over-travel from a hard sideways hit.", wood: "Brush through the toe pocket and keep the landing hand centred over the bolts.", steps: ["1. Fakie Set", "2. Toe-edge Brush", "3. Catch Bolts"], faults: ["Flicking from the heel edge", "Excess lateral travel", "Late catch"] },
  { id: "switch-heelflip", name: "Switch Heelflip", short: "SHF", category: "flips", difficulty: 5, flickKind: "heel-flick", flip: -360, shuv: 0, cue: "Use the mirrored switch pocket and flick out through the heel edge; keep the shoulder and wrist from rotating open.", plastic: "Use a sharp but small heel-edge flick to prevent the deck sliding sideways.", wood: "Let the foam grip carry the flick while the wrist stays aligned with the deck.", steps: ["1. Switch Stance", "2. Heel-edge Flick", "3. Square Catch"], faults: ["Using regular stance placement", "Flicking too far outward", "Twisting the wrist"] },
  { id: "nollie-pop-shuvit", name: "Nollie Pop Shuvit", short: "NPS", category: "spins", difficulty: 3, popOrigin: "nose", flickKind: "scoop-fs", flip: 0, shuv: -180, cue: "Pop from the nose pocket and scoop the tail across the deck axis; lift the index so it does not block the rotation.", plastic: "Keep the scoop compact on slick plastic; too much sweep creates a runaway spin.", wood: "Use the foam grip to guide the scoop, but release pressure at the rotation midpoint.", steps: ["1. Nose Load", "2. Tail Scoop", "3. Catch Grip-side Up"], faults: ["Popping the tail", "No horizontal scoop", "Fingers following the board too late"] },
  { id: "fakie-pop-shuvit", name: "Fakie Pop Shuvit", short: "FPS", category: "spins", difficulty: 2, flickKind: "scoop-bs", flip: 0, shuv: 180, cue: "Pop from the fakie tail pocket and sweep the tail around with a short middle-finger curl; keep the index hovering over the centre.", plastic: "A small fast scoop is enough; avoid pushing the whole deck across the surface.", wood: "Maintain light contact into the pocket, then release cleanly so grip friction does not stall the rotation.", steps: ["1. Fakie Pocket", "2. Curl & Scoop", "3. Centre Catch"], faults: ["Whole-hand shove", "Too much scoop", "Catch off-centre"] },
  { id: "switch-pop-shuvit", name: "Switch Pop Shuvit", short: "SPS", category: "spins", difficulty: 3, flickKind: "scoop-fs", flip: 0, shuv: -180, cue: "Reverse the usual scoop direction from switch stance; keep the deck centred under both pads as it yaws.", plastic: "Use a quick low-force scoop and let the plastic deck rotate freely.", wood: "Use continuous pressure through the pocket, then lift both pads to let the board finish.", steps: ["1. Switch Stance", "2. Opposite Scoop", "3. Centre Catch"], faults: ["Regular-direction scoop", "Pushing rather than scooping", "Landing with deck offset"] },

  // Flip families
  { id: "double-heelflip", name: "Double Heelflip", short: "DHF", category: "flips", difficulty: 4, flickKind: "toe-flick", flip: -720, shuv: 0, cue: "Build enough upward pop to buy a second rotation, then flick through the toe edge without adding a second separate tap.", plastic: "Use a very clean flick impulse; plastic can rotate quickly, so wait for the grip to return before catching.", wood: "A slightly longer brush helps generate the second rotation; keep the index relaxed after release.", steps: ["1. High Tail Pop", "2. Extended Toe Flick", "3. Delay Catch"], faults: ["Insufficient height", "Two uneven flicks", "Catching at 270°"] },
  { id: "triple-kickflip", name: "Triple Kickflip", short: "TKF", category: "flips", difficulty: 5, flickKind: "heel-flick", flip: 1080, shuv: 0, cue: "Prioritise vertical hang time, then flick through the heel pocket with a fast clean release; do not chase the deck sideways.", plastic: "Keep the deck centred and use a crisp flick; do not over-scoop the plastic tail.", wood: "Drive a longer controlled flick and keep your index finger clear until all three rotations complete.", steps: ["1. Maximum Pop", "2. Fast Clean Flick", "3. Late Catch"], faults: ["Not enough pop height", "Flick too weak or dragged", "Premature catch"] },
  { id: "late-kickflip", name: "Late Kickflip", short: "LKF", category: "flips", difficulty: 5, flickKind: "heel-flick", flip: 360, shuv: 0, cue: "Pop a clean ollie first, hold the deck level for a beat, then flick the heel edge after the apex. The late action must be separate from the pop.", plastic: "Use a compact late flick; plastic responds quickly, so release as soon as the grip begins to turn.", wood: "Hold the ollie plateau, then brush the heel edge with a deliberate short flick.", steps: ["1. Clean Ollie", "2. Pause at Apex", "3. Late Heel Flick"], faults: ["Early combined pop/flick", "No apex pause", "Late flick while descending"] },
  { id: "late-heelflip", name: "Late Heelflip", short: "LHF", category: "flips", difficulty: 5, flickKind: "toe-flick", flip: -360, shuv: 0, cue: "Get the deck into a level ollie, pause at apex, then brush the toe edge to start the heelflip late.", plastic: "The late flick should be brief; too much sideways force sends the deck out of frame.", wood: "Use a controlled toe-side brush after the apex pause, then move your hand back over the bolts.", steps: ["1. Level Ollie", "2. Apex Hold", "3. Late Toe Flick"], faults: ["Flicking during pop", "No separation between phases", "Catching before rotation"] },
  { id: "pressure-flip", name: "Pressure Flip", short: "PF", category: "flips", difficulty: 4, flickKind: "scoop-bs", flip: 360, shuv: 180, cue: "Load the back pocket with a curled middle finger and scoop diagonally; the flip comes from the pocket pressure, not a conventional index flick.", plastic: "The slicker setup can slip from the pocket, so keep the curl centred and the scoop compact.", wood: "Use foam friction to hold the pocket load, then release the scoop smoothly rather than pinching.", steps: ["1. Pocket Load", "2. Diagonal Pressure Scoop", "3. Catch Grip-side Up"], faults: ["Flat fingers", "Index flick replacing pocket pressure", "Scoop too wide"] },
  { id: "pressure-heelflip", name: "Pressure Heelflip", short: "PHF", category: "flips", difficulty: 5, flickKind: "scoop-fs", flip: -360, shuv: -180, cue: "Curl into the front/toe pocket and scoop frontside while lifting the nose; avoid an ordinary heelflip-style edge flick.", plastic: "Keep pocket pressure narrow; plastic does not need a large lateral shove.", wood: "Let the foam grip load the pocket before the frontside scoop, then release your middle finger.", steps: ["1. Front Pocket Load", "2. FS Pressure Scoop", "3. Soft Catch"], faults: ["No pocket curl", "Backside scoop direction", "Deck drifts away"] },
  { id: "dolphin-flip", name: "Dolphin Flip", short: "DF", category: "flips", difficulty: 5, flickKind: "toe-flick", flip: 360, shuv: 0, cue: "Drive the nose down and forward with a steep, forward-directed flick so the deck dives and flips beneath the hand.", plastic: "Use a short forward toe-side snap; avoid pressing the deck into the surface before it clears.", wood: "Brush forward through the nose pocket while keeping the wrist compact and the tail free.", steps: ["1. Tail Pop", "2. Forward Nose Drive", "3. Catch After Dive"], faults: ["Ordinary kickflip flick", "No forward/downward pitch", "Hand follows instead of hovering"] },
  { id: "hospital-flip", name: "Hospital Flip", short: "HF", category: "flips", difficulty: 5, flickKind: "wrap-tail", flip: 360, shuv: 180, cue: "Pop into the flip, then guide the nose-side wrap so the deck completes its half-turn and returns under your fingers.", plastic: "Keep the wrap tight; the plastic deck can accelerate once it leaves the fingertip.", wood: "Use a smooth wrap around the tail/nose pocket and avoid pinching the deck mid-rotation.", steps: ["1. Pop & Lift", "2. Wrap Around Nose", "3. Re-centre & Catch"], faults: ["No wrap action", "Only a normal kickflip", "Catch before half-turn"] },
  { id: "underflip", name: "Underflip", short: "UF", category: "flips", difficulty: 4, flickKind: "wrap-tail", flip: -360, shuv: 0, cue: "Lift the deck with the tail pop, then hook the underside edge with a quick upward wrap rather than flicking over the top.", plastic: "Use a fast under-edge hook with minimal side force.", wood: "Let the grip release cleanly before the underside hook; do not drag the board along the table.", steps: ["1. Pop Clear", "2. Hook Underside", "3. Catch Level"], faults: ["Topside flick", "Not enough clearance", "Hook too late"] },
  { id: "fingerflip", name: "Fingerflip", short: "FF", category: "flips", difficulty: 3, flickKind: "wrap-tail", flip: 360, shuv: 0, cue: "Use the middle finger to wrap the tail edge and roll the board over its long axis; let the index guide the centre without blocking rotation.", plastic: "Use a quick, clean tail wrap; do not over-pinch the thin deck.", wood: "Use grip friction to guide the wrap and release the index as the board rotates.", steps: ["1. Tail Lift", "2. Finger Wrap", "3. Catch Grip-side Up"], faults: ["Only lifting the deck", "Index blocks the flip", "Catch before rotation completes"] },
  { id: "casper-flip", name: "Casper Flip", short: "CF", category: "flips", difficulty: 5, flickKind: "wrap-tail", flip: 360, shuv: 180, cue: "Roll the deck into a controlled upside-down Casper position, then hook and unwind it with a finger wrap into a normal grip catch.", plastic: "The slick deck can escape during the upside-down hold; keep the wrap controlled and close to the board.", wood: "Use grip to stabilise the Casper moment, then lift cleanly into the return rotation.", steps: ["1. Enter Casper", "2. Hook & Unwind", "3. Catch Grip-side Up"], faults: ["No controlled inverted phase", "Wrap misses the edge", "Board returns off-axis"] },
  { id: "kickflip-body-varial", name: "Kickflip Body Varial", short: "KBV", category: "flips", difficulty: 4, flickKind: "heel-flick", flip: 360, shuv: 180, cue: "Combine a normal kickflip with a half body-varial yaw; separate the heel-edge flick from the horizontal rotation so they do not cancel.", plastic: "Keep the shuv component compact and let the deck finish rotating freely.", wood: "Brush the heel edge and add a distinct wrist-led half-turn rather than forcing both motions at once.", steps: ["1. Tail Pop", "2. Heel Flick + 180°", "3. Catch Across Bolts"], faults: ["Only kickflip rotation", "Shuv direction reversed", "Wrist over-rotates"] },
  { id: "double-varial-kickflip", name: "Double Varial Kickflip", short: "DVK", category: "flips", difficulty: 5, flickKind: "heel-flick", flip: 720, shuv: 180, cue: "Generate a compact half-shuv with a double kickflip rotation; flick vertically enough for two flips without widening the lateral travel.", plastic: "A short sharp flick is more controllable than a long swipe on plastic.", wood: "Use a longer but smooth grip-assisted brush, then hover over the deck until the second turn completes.", steps: ["1. Deep Tail Pop", "2. Double Heel Flick", "3. Delayed 180° Catch"], faults: ["Single flip only", "Too much shuv drift", "Catching after first rotation"] },

  // Scoops, shuvits and body rotation
  { id: "fs-bigspin", name: "Frontside Bigspin", short: "FSB", category: "spins", difficulty: 4, flickKind: "scoop-fs", flip: 0, shuv: -540, wrist: 38, cue: "Scoop the deck frontside through 360° while your hand guides the additional 180° body turn; keep the board under the palm.", plastic: "A quick compact frontside scoop is enough; lift fingers to stop friction from damping the final half-turn.", wood: "Use a smooth committed scoop and let the grip carry the board through the final rotation.", steps: ["1. Load FS Pocket", "2. Scoop 360° + Turn", "3. Catch Centre"], faults: ["Only a 180° shuv", "Backside scoop direction", "Wrist does not follow through"] },
  { id: "bs-bigspin", name: "Backside Bigspin", short: "BSB", category: "spins", difficulty: 4, flickKind: "scoop-bs", flip: 0, shuv: 540, wrist: 38, cue: "Scoop the board backside through 360° and coordinate the extra 180° body rotation without pushing the deck off-centre.", plastic: "Keep the scoop short and fast; the board should rotate under the fingertips, not translate away.", wood: "Use an even pocket curl and controlled wrist follow-through through the full turn.", steps: ["1. Load BS Pocket", "2. Scoop 360° + Turn", "3. Catch Centre"], faults: ["Only 180° rotation", "FS scoop direction", "Board travels sideways"] },
  { id: "360-bigspin", name: "360 Bigspin", short: "3BS", category: "spins", difficulty: 5, flickKind: "scoop-bs", flip: 0, shuv: 720, wrist: 48, cue: "Drive a full 540° board spin and an additional 180° body turn; keep the index lifted until the deck returns to its catch path.", plastic: "Use a quick release and avoid adding extra sideways shove after the first full rotation.", wood: "Build the spin progressively with a deep pocket curl, then release and track the deck through the final half-turn.", steps: ["1. Deep BS Load", "2. Drive 540° + Body Turn", "3. Catch on Axis"], faults: ["Under-rotated shuv", "Wrist stops early", "Deck exits catch corridor"] },
  { id: "540-shuvit", name: "540 Shuvit", short: "540S", category: "spins", difficulty: 4, flickKind: "scoop-bs", flip: 0, shuv: 540, wrist: 30, cue: "Use a longer backside pocket scoop than a 360 shuvit, then lift both pads clear so the deck can complete one and a half turns.", plastic: "Release pressure early; plastic keeps spinning after the scoop impulse.", wood: "Maintain the scoop through the initial rotation, then let friction settle the deck under your fingers.", steps: ["1. Curl Tail Pocket", "2. Long BS Scoop", "3. Wait for Grip"], faults: ["Scoop too short", "Fingers block the deck", "Catch at 360°"] },
  { id: "720-shuvit", name: "720 Shuvit", short: "720S", category: "spins", difficulty: 5, flickKind: "scoop-fs", flip: 0, shuv: -720, wrist: 50, cue: "Generate two complete horizontal rotations with a deep but compact frontside scoop, then keep the hand centred while the board completes the last quarter-turn.", plastic: "Use a fast impulse then fully release; continuing to push will throw the deck off-axis.", wood: "Use a smooth long scoop with a clean release; do not hold the deck through its second rotation.", steps: ["1. Deep FS Pocket", "2. Two-turn Scoop", "3. Late Centre Catch"], faults: ["Scoop lacks full impulse", "Board drifts away", "Catch before grip returns"] },
  { id: "fakie-tre-flip", name: "Fakie Tre Flip", short: "FTF", category: "spins", difficulty: 5, flickKind: "scoop-bs", flip: 360, shuv: 360, cue: "From fakie, pair a backside pocket scoop with a heel-edge flick; keep the two impulses flowing as one diagonal motion.", plastic: "Use a compact scoop and quick flick; avoid over-rotating the plastic deck.", wood: "Let the foam grip hold the pocket for the scoop, then brush through the heel edge in one motion.", steps: ["1. Fakie Pocket", "2. BS Scoop + Flick", "3. Catch Bolts"], faults: ["Missing flip component", "Shuv stalls at 180°", "Flick too late"] },
  { id: "nollie-tre-flip", name: "Nollie Tre Flip", short: "NTF", category: "spins", difficulty: 5, popOrigin: "nose", flickKind: "scoop-fs", flip: 360, shuv: -360, cue: "Load the nose, initiate the frontside scoop from the tail, and add a heel-edge flick only as the board leaves the surface.", plastic: "Keep the combined impulse narrow and release the nose immediately after the pop.", wood: "Use a progressive tail scoop and heel-edge brush; do not let the nose hand stay heavy.", steps: ["1. Nose Snap", "2. FS Scoop + Flick", "3. Catch on Bolts"], faults: ["Tail-pop instead of nollie", "Only a shuv rotation", "Flick starts before pop"] },

  // Rails, ledges and obstacle locks
  { id: "nosegrind", name: "Nosegrind", short: "NG", category: "grinds", difficulty: 3, flickKind: "grind-lock", flip: 0, shuv: 0, targetPitch: -16, cue: "Ollie onto the ledge with the front truck locked and the nose pressed down; keep the rear truck lifted and travel parallel to the edge.", plastic: "Pinch lightly over the front truck; too much pressure on slick plastic makes the nose bounce off.", wood: "The foam grip helps hold the nose, but avoid dragging the front truck sideways against the ledge.", steps: ["1. Approach Parallel", "2. Front Truck Lock", "3. Lift & Exit"], faults: ["Both trucks touch (50-50)", "Rear truck drops", "Approach angle too wide"] },
  { id: "tailslide", name: "Tailslide", short: "TS", category: "grinds", difficulty: 4, flickKind: "grind-lock", flip: 0, shuv: 180, targetPitch: 18, cue: "Rotate the deck so the tail clears and locks on the ledge; keep the nose lifted and the board travelling along the edge.", plastic: "Use a light tail lock; slick plastic can slip off the ledge if you lean too far.", wood: "Use a controlled tail press and let the foam grip stabilise the slide without over-twisting.", steps: ["1. Pop & Rotate", "2. Tail Lock / Nose Up", "3. Unweight to Exit"], faults: ["Truck locks instead of tail", "Nose dips", "Board turns across ledge"] },
  { id: "noseslide", name: "Noseslide", short: "NS", category: "grinds", difficulty: 3, flickKind: "grind-lock", flip: 0, shuv: -180, targetPitch: -18, cue: "Turn the deck across the ledge and set the underside of the nose on the edge; keep the tail raised and slide straight.", plastic: "Use a precise nose contact; slick plastic can rotate off the ledge if the approach is crooked.", wood: "Use the grip to stabilise the nose contact, then keep the rear end elevated with the middle finger.", steps: ["1. Approach", "2. Nose Locks Across", "3. Lift & Revert"], faults: ["Truck touches first", "Tail drops", "Landing too far off line"] },
  { id: "lipslide", name: "Lipslide", short: "LS", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 0, shuv: 180, wrist: 24, targetPitch: 0, cue: "Clear the near edge with a 180° rotation, then set the deck across the ledge with both trucks beyond the lip; keep the slide centred.", plastic: "Release the deck after the rotation and let it settle; avoid a forceful sideways press.", wood: "Use a controlled wrist turn into the lip and maintain even finger pressure through the slide.", steps: ["1. Pop Above Lip", "2. 180° Across Edge", "3. Balance & Exit"], faults: ["Boardslide instead of lipslide", "Under-rotated entry", "Over-rotated past the ledge"] },
  { id: "feeble-grind", name: "Feeble Grind", short: "FG", category: "grinds", difficulty: 4, flickKind: "grind-lock", flip: 0, shuv: 180, wrist: 22, targetPitch: 14, cue: "Lock the front truck over the rail while the rear truck sits on the far side; keep the deck slightly tweaked and the nose up.", plastic: "Use a small controlled tweak so the rear truck does not bounce out.", wood: "Lean into the rear truck just enough to hold the feeble angle without turning into a 50-50.", steps: ["1. Pop & Turn", "2. Front Truck Over / Rear Lock", "3. Untweak & Exit"], faults: ["Both trucks centred", "Rear truck misses rail", "Nose drops under load"] },
  { id: "blunt-slide", name: "Blunt Slide", short: "BSL", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 0, shuv: 180, targetPitch: 24, cue: "Get the tail and rear truck over the edge with the nose high, then balance the deck on the tail pocket for a short slide.", plastic: "The light deck can bounce from a blunt lock; reduce the landing force and keep the nose lifted.", wood: "Use the foam grip to hold the tail pocket while your index finger maintains nose lift.", steps: ["1. Pop Above Edge", "2. Tail / Rear Truck Lock", "3. Lift Out Clean"], faults: ["Lands in 5-0", "Nose drops", "Too much force on contact"] },
  { id: "noseblunt", name: "Noseblunt Slide", short: "NBS", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 0, shuv: -180, targetPitch: -24, cue: "Rotate the nose over the ledge and lock the nose/truck area with the tail raised; keep the deck across the obstacle without over-rotating.", plastic: "Use gentle nose pressure and release the opposite finger so the deck does not slip off.", wood: "Use grip friction for the nose lock and keep a light tail lift throughout the slide.", steps: ["1. Clear the Lip", "2. Noseblunt Lock", "3. Lift & Revert"], faults: ["Nosegrind instead of blunt", "Tail drops", "Rotation continues past lock"] },
  { id: "overcrook", name: "Overcrook Grind", short: "OC", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 0, shuv: -35, targetPitch: -18, cue: "Set the front truck over the ledge with the deck angled sharply toward the nose; balance on the crooked front-truck lock rather than a straight nosegrind.", plastic: "Use a compact front-truck pinch; do not let the slick deck bounce outward.", wood: "Keep a little more index pressure through the crook angle, then release smoothly at the end.", steps: ["1. Approach Angled", "2. Crook Front Truck", "3. Nudge & Exit"], faults: ["Straight nosegrind lock", "Deck angle too small", "Front truck slips off edge"] },
  { id: "willy-grind", name: "Willy Grind", short: "WG", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 0, shuv: 25, targetPitch: 16, cue: "Lock onto the edge with the front truck and a lifted rear end, keeping the deck tweaked over the ledge; balance the pressure across the index pad.", plastic: "Keep the lock light and avoid over-pressing the truck into the rail.", wood: "Use the foam grip to stabilise the tweaked angle and keep the wrist aligned with travel.", steps: ["1. Approach with Control", "2. Front Truck Tweaked Lock", "3. Release & Catch"], faults: ["Deck levels into 50-50", "Rear end drops", "Lock is too far from edge"] },
  { id: "kickflip-50-50", name: "Kickflip 50-50", short: "KF 50", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 360, shuv: 0, cue: "Complete a kickflip onto the ledge and catch both trucks square on the rail; the rotation must finish before the truck lock.", plastic: "Wait for the grip to return before loading both trucks; plastic can rebound if you stomp too early.", wood: "Catch with both index and middle pads above the trucks, then let the foam grip settle into the lock.", steps: ["1. Pop + Kickflip", "2. Spot Both Trucks", "3. Lock 50-50"], faults: ["Flip incomplete at contact", "Only one truck locks", "Approach angle too steep"] },
  { id: "kickflip-boardslide", name: "Kickflip Boardslide", short: "KF BS", category: "grinds", difficulty: 5, flickKind: "grind-lock", flip: 360, shuv: 180, cue: "Finish the kickflip and half-turn before placing the deck perpendicular across the rail; keep fingers centred over the deck through the slide.", plastic: "Release early after the flip; a heavy sideways push can eject the plastic deck.", wood: "Use grip contact to settle into the slide and avoid twisting the board after lock-in.", steps: ["1. Kickflip Pop", "2. 180° to Boardslide", "3. Centre & Exit"], faults: ["Flip still rotating at contact", "Deck parallel not perpendicular", "Board slips off rail"] },
];

export const ADDITIONAL_TRICKS: Trick[] = RECIPES.map(makeTrick);
