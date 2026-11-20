# DeckCoach — requirement-by-requirement implementation audit

This audit describes the code in this repository. “Implemented” means there is a real local workflow in the app; it does not mean computer vision has been validated on every camera, hand, board, lighting condition or trick. “Partial” means some real functionality exists, but the full behaviour requested is not yet delivered. A static browser build cannot perform online community submission or award remote premium access without an online service.

## Platform, camera and deployment

| Original requirement | Status | How it works / what's still true |
|---|---|---|
| React + Vite + Tailwind + TypeScript | Implemented | This is the project stack. `npm run dev`, `npm run build`, `npm test` and `npm run lint` are declared scripts. |
| Zero-server, zero-API-cost | Implemented with network caveat | App state, inference, analysis, replay rendering and storage run in the browser. No app server, external inference API, account service or API key is required. MediaPipe WASM/model and display fonts are fetched from public CDNs on first use, so this is not a guaranteed air-gapped/offline package. |
| Keep `getUserMedia`, iOS `playsInline` and muted support | Implemented | The camera hook requests a stream only after entering a session, sets `muted`, and adds `playsinline`. It handles mobile front/rear selection, desktop camera cycling, permission failures, retries and stale async camera requests. HTTPS (or localhost for development) is required by browser camera permissions. |
| Keep local MediaPipe HandLandmarker | Implemented | The app uses the pinned `@mediapipe/tasks-vision` package and one-hand video inference. It tries GPU then falls back to CPU. It tracks hand landmarks locally; it does not send video to an app server. |
| Work on mobile and desktop | Partially verified | Responsive layouts, camera selection and mobile video attributes are in place. Real-device testing is still required for device-specific camera permissions, performance, aspect ratio and storage limits. |
| GitHub + Vercel hosting | Implemented configuration | Vite output is `dist`; `vercel.json` supplies the SPA rewrite. A successful production build still needs to be run where dependencies can be installed. |

## Interface and board setup

| Original requirement | Status | How it works / what's still true |
|---|---|---|
| Make UI fit the board, not the board fit the UI | Partial | Board/ghost scale is driven from a hand-landmark calibration and viewport size, and the guide follows the calibration. The real deck outline is not segmented, so this is an estimate from the fingers rather than a measured deck boundary. |
| Finger dots use arrows to show movement | Implemented | The stance guide includes finger placements and directional paths; the live fingertip overlay can show movement vectors and trails. |
| Minimal, spacious, graffiti/skater visual direction | Implemented as current direction | The home screen uses a dim brick-wall skate-spot scene, dark surfaces, red/purple accents and display/marker styling. It is less dashboard-like and keeps the live view central. The user's separate visual reference images have not yet been supplied, so exact reference matching remains open. |
| Skatepark atmosphere on the home screen | Implemented | The home view presents a dark brick spot, board selection, trick library, clips and challenge shortcuts. |
| Low-key no-camera fallback, not a blocking popup | Implemented | A brick-spot demo view and small camera status/retry treatment remain available when camera permission or hardware is missing. |
| Board profile selection after Play | Implemented | The home Play/Skate action opens the board locker, where an existing profile can be selected or a new one created before the camera starts. |
| Create and save multiple board profiles | Implemented | Profiles are stored in localStorage and include name, wood/plastic material, grip, width band, shape, weight feel, concave and approximate deck length. |
| Identify whether deck is wood or plastic | Manual selection implemented; automatic detection not implemented | The user chooses the material. The selected material controls the analyser's wood/plastic sensitivity and wording. A normal single RGB camera view cannot reliably infer material from appearance alone. |
| Scan a board model for manufacturer dimensions/weight/grip | Not implemented | The profile form asks for information the user can reasonably choose. It does not identify a brand/model or look up manufacturer specifications. No verified offline board-specification catalogue is bundled. |
| Truck/deck photo in profile with background removed | Partial | A photo can be added and displayed in the profile. A local edge-connected colour cutout removes a plain background approximately. It is not robust AI segmentation and will struggle with busy backgrounds, shadows or similar-coloured objects. |

## Tracking, trick library and coaching

| Original requirement | Status | How it works / what's still true |
|---|---|---|
| Track fingers continuously, show tip markers only when enabled | Implemented | MediaPipe inference remains active while the camera is live. The Tip Track control toggles the visible overlay, not the underlying tracking. |
| Board tracking / faint highlight / rotation attention | Partial | A small image region under the fingertips is analysed for high-contrast shape, pitch and optical-flow-like motion. Telemetry can drive rotation/landing estimates and the overlay. It is not robust full-deck segmentation, invisible-marker tracking or calibrated six-degree-of-freedom tracking. |
| Board-aware ghost preview, approximately the user's board size | Partial | The ghost deck is rendered at the scale estimated by finger calibration and animates the selected trick's stored motion template. It does not track the actual deck shape/material or guarantee exact physical equivalence. |
| A large trick selection with useful advice | Implemented for supported catalogue | The current catalogue contains 65 pop-oriented profiles across basics, flips, spins and grinds/slides. Each profile has stance points, finger vectors, a preview path, material cues and structured setup/execution/timing/catch/fault notes. Search and categories are available. It is not literally every trick ever performed on a fingerboard. |
| Every known Tech Deck trick | Not complete | Manuals, nose manuals, balance holds, pivots, many stalls, variations and advanced combinations are not exhaustively represented. Many static/balance-led tricks need a different detector. The catalogue should be expanded from the skater's actual use cases and test clips. |
| Advice that applies to the selected trick | Partial-to-implemented | The trick profile provides specific mechanical cues and expected movement signatures. The analyser compares measured hand/board estimates with the selected signature and returns score, likely fault, correction arrows and replay frames. The current thresholds are heuristics, not a validated biomechanical model. |
| Wrist movement / finger curl / technique | Partial | The app derives wrist rotation/yaw and index/middle finger curl from MediaPipe landmarks and can use them in diagnosis. It does not track finger pressure, force, true contact points, friction or actual deck flex. |
| Sketchy landings / primo / rocket / failure reasons | Partial | The analyser has clean, sketchy, primo and rocket-style outcomes plus diagnosis keys for dead pop, timing, curl, wrist turn, mismatch and grind-lock issues. These are estimates from fingertip and local board-motion signals and can be wrong when tracking is noisy. |
| Real fingerboard physics | Not complete | Coaching contains technique heuristics and simple kinematic features. It is not a rigid-body simulator and does not model measured mass, truck geometry, grip friction, force, collision contacts or surface physics. |

## Attempts, clips and practice features

| Original requirement | Status | How it works / what's still true |
|---|---|---|
| Only record when a real trick-like movement is attempted | Implemented with detection limits | A short in-memory pre-roll is maintained while a hand is present. The recorder persists a clip only after a pop-to-air-to-land sequence passes motion thresholds; resting noise and many incidental gestures are discarded. The thresholds may miss unusual real attempts or accept some false positives. |
| Selected trick determines whether it was attempted | Partial | The analyser evaluates the active selected trick's signature and reports a match confidence/mismatch. It does not independently recognise every trick class from scratch; it is closer to selected-target verification. |
| Slow-motion replay | Implemented | Captured frames can be replayed at reduced speed, with frame-by-frame review and diagnostic overlays. Video export is available when the browser supports encoding; still-frame fallback is retained. |
| Show exactly what to change | Partial | The replay highlights a key/mistake frame and draws correction arrows with a specific cue derived from the analyser's diagnosis. It is not pixel-perfect motion capture and should be checked against real attempts. |
| Save, revisit and export clips | Implemented with local limits | Up to 10 recent clips are stored in IndexedDB on the same browser/device, with still-frame fallback, video export/share and deletion. Device storage quotas can limit persistence. There is no cloud sync. |
| Daily trick, weekly challenge, daily training | Implemented locally | The app supplies a deterministic daily trick, a daily five-rep warm-up, session history and a rotating weekly featured trick/challenge draft. Daily completion is stored locally. |
| Tutorials such as Boned Ollie | Implemented for included tutorials | The Boned Ollie tutorial is a multi-phase drill that checks measured pop/timing/catch conditions. Kickflip and Pop Shuvit drills are also included. More tutorials can be added as data-driven phases. |
| Weekly clip challenge and free premium reward | Local challenge draft only | A qualifying clip can be attached to a local entry draft and exported with a receipt. The app explicitly says the entry is not sent. Public submission, community voting/judging and granting premium access require an online service and cannot be completed by a strictly server-free static app alone. |

## Obstacle mapping

| Original requirement | Status | How it works / what's still true |
|---|---|---|
| Scan for obstacles and measure their size relative to the board | Partial/manual | The mapper freezes a camera frame; the user draws a box around a rail, ledge, gap, ramp, box or manual pad. Width/height are estimated relative to the locked board length. Perspective, tilt and crop affect accuracy. |
| Map obstacle dimensions and fit tricks to it | Partial | Saved spots produce obstacle-type-specific coaching and trick recommendations. The user can select or delete saved spots. Maps persist locally. They do not perform automatic detection or collision/clearance simulation. |
| Understand depth/3D obstacle shape | Not automatic | An optional depth estimate can now be entered manually. A single monocular RGB view cannot reliably infer physical depth/3D geometry without additional assumptions or a dedicated depth model and calibration. Curvature, material, approach speed and real clearance are not reconstructed. |

## Remaining blockers before calling the whole vision complete

1. Test the app on the actual fingerboard, hand, phone/desktop camera and lighting that will be used. This is necessary to tune thresholds and expose false positives/negatives.
2. Add a proper full-deck detector/segmentation model or a reliable marker-based calibration workflow, then estimate deck orientation against a fixed reference.
3. Build a distinct balance/manual/stall detector before advertising those tricks as recognisable.
4. Add a validated board-spec catalogue or a user-driven model lookup workflow if automatic board identification remains a requirement.
5. Add perspective/depth calibration or a true depth source before claiming automatic obstacle 3D scanning.
6. Choose an online submission/reward provider if the weekly challenge must actually receive public entries and grant free premium access. This changes the zero-server constraint.
7. Install dependencies and run `npm run build`, `npm test` and `npm run lint` in a normal developer environment; then deploy a preview and test mobile Safari/Chrome plus desktop Chrome.

**Honest conclusion:** this is a working browser-side practice prototype with a meaningful coaching and clip workflow, not a fully validated biomechanical simulator. A literal 100% completion claim would be misleading until the tracking, physics, obstacle reconstruction and community-service blockers above are solved and tested on real attempts.
