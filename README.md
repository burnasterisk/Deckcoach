# DeckCoach

A camera-based fingerboard trainer and practice log. DeckCoach is designed as a static browser app: the camera, hand inference, trick analysis, replay rendering, board profiles and practice history run on the device. There is no app server, account requirement, paid API or API key.

## What's in this build

### Skate session

- Camera starts only after **Play**. It uses `getUserMedia`, `playsInline` and muted video settings suitable for mobile Safari and desktop browsers.
- MediaPipe `HandLandmarker` tracks one hand locally. Tracking remains active when fingertip graphics are hidden; **Tip Track** only controls the visible markers and vectors.
- Board calibration estimates a board-sized working frame from the index and middle finger landmarks. The visual board-motion tracker samples the image region beneath the fingertips to estimate rotation/motion; it is not reliable full-deck segmentation or a physical motion-capture system.
- Choose a trick, view the stance/finger arrows, turn on the scale-matched Ghost Deck preview, and receive a scored attempt with a diagnosis, likely failure reason and correction cue.
- Trick analysis is strongest for visible pop/flick/scoop/rotation attempts. It cannot reliably classify every fingerboard movement, especially static balance holds and subtle manual or stall variations.

### Trick catalogue and technique notes

There are **65 pop-based trick profiles** across basics, flips, spins and grinds/slides. Each profile includes a stance layout, directional finger vectors, a preview motion, a target motion signature, wood/plastic cues and structured notes for setup, execution, timing, catch/exit and common faults.

The catalogue is intentionally honest about detector coverage: it is not literally every named fingerboard trick. Manuals, nose manuals, finger balance, pivot/stall variations and other static or balance-led tricks need a separate state/balance detector before they can be scored accurately. The current trick templates and thresholds are coaching heuristics and should be tuned against real recorded attempts during testing.

### Board profiles

The **Play → Board Profile** flow lets you save multiple boards locally. Profiles include:

- Name, deck material (wood/plastic), grip type and board shape.
- Approximate width band, qualitative weight feel, concave and deck length.
- An optional board/truck photo, processed locally into a small profile image.

The optional photo cutout is an edge-connected plain-background removal, not AI object segmentation. It does not recognise a manufacturer/model or infer exact specs. Material selects the existing wood/plastic analyser profile; width, weight feel and concave make small sensitivity adjustments. Grip and shape remain saved reference details and do not yet alter the analyser. These settings are not a calibrated physics simulation.

### Clips and replay

- A small pre-roll is kept in memory while a hand is visible. A clip is only created after the analyser detects a pop-to-air-to-land attempt that passes the real-trick-motion filter; an aborted or non-trick movement is discarded.
- Clips include a slow-motion annotated replay, a marked coaching frame, and a video export when the browser can encode it.
- Up to **10 recent clips** are saved in IndexedDB on the device, including frame stills for replay where storage allows. Large mobile storage limits may force still-image-only persistence or prevent a save; export important clips to keep a separate copy.
- Clips are local to that browser/device. They do not sync to another device or upload automatically.

### Spot mapper

Use **Map Spot** during a session to freeze the current camera view, draw a box around a rail, ledge, gap, ramp, box or manual pad, and estimate its visible 2D width and height relative to the locked board length. The map is saved locally and supplies obstacle-specific practice cues plus quick-select trick recommendations in the session HUD.

This is a manually marked 2D scale estimate, not automatic obstacle detection or a 3D scan. Camera perspective, object orientation and the accuracy of the board lock affect the estimate. Depth is deliberately left unknown; approach speed, curvature, surface material and actual clearance are not reconstructed. Use the result as a rough practice reference and verify the real obstacle by eye.

### Training and challenge tools

- Daily warmup, trick of the day, guided tutorials, training history and a weekly clip-challenge draft.
- Challenge entries are local drafts. The **Export Entry + Clip Files** action shares or downloads a JSON entry receipt and the associated clip when available, so the skater can attach/send them to an organiser themselves.
- There is no automatic public submission, remote judging, winner selection or premium reward. Those functions require an external submission/reward service and cannot be delivered by a zero-server static app alone.

## Privacy, network use and offline behaviour

- Camera frames are not uploaded for hand inference. The app does not require a third-party API key and does not send video to an application server.
- The MediaPipe Tasks WASM files are currently fetched from jsDelivr and the HandLandmarker model from Google's public model storage when tracking first loads. The graffiti/display fonts are also loaded from Google Fonts. First-use tracking and the custom typography therefore need internet access unless those assets are later vendored into the project. MediaPipe's published privacy notice also describes SDK usage/performance metrics; this build should not be described as strictly zero-network or guaranteed telemetry-free.
- Board profiles, session history, challenge drafts and obstacle maps stay in browser storage; the last 10 clips are saved in IndexedDB when available. Clearing site data, changing browsers or changing devices can remove or strand that data. Export clips you want to keep.

## Develop locally

```sh
npm install
npm run dev      # http://localhost:3000
npm test
npm run build
npm run lint
```

Camera access requires a secure context. `localhost` is accepted by browsers for local development; phones and deployed sites should use HTTPS.

## Deploy to GitHub + Vercel

1. Push the project to a GitHub repository.
2. Import that repository in Vercel.
3. Use the standard Vite settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
4. No environment variables are required. `vercel.json` includes the single-page-app rewrite.

The same repository can be hosted as a static site on any service that serves the Vite `dist` directory and supports SPA rewrites.

## Source map

- `src/App.tsx` – app shell, camera lifecycle, profile selection and session state
- `src/components/deckcoach/` – home, board-profile flow, HUD, drawers, spot mapper and replay UI
- `src/lib/board-profiles.ts` – local board profile model and qualitative handling adjustments
- `src/lib/tricks.ts` and `src/lib/additional-tricks.ts` – 65 trick profiles and technique data
- `src/lib/trick-analyzer.ts` – attempt scoring, matching, diagnosis and corrections
- `src/lib/board-calibration.ts` and `src/lib/board-tracker.ts` – working board scale and estimated movement
- `src/lib/obstacle-maps.ts` – local 2D spot estimates and trick recommendations
- `src/lib/clip-storage.ts` and `src/hooks/use-clip-recorder.ts` – motion-gated IndexedDB clip persistence
- `src/lib/camera.ts` and `src/hooks/use-camera.ts` – camera selection and lifecycle
- `src/hooks/use-hand-tracking.ts` and `src/lib/hand-tracking.ts` – local MediaPipe inference setup
