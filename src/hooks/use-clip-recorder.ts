import { useCallback, useEffect, useRef, useState } from "react";

import type { BoardTrackTelemetry } from "@/lib/board-tracker";
import { deleteClipRecord, loadClipRecords, saveClipRecord, updateStoredClip } from "@/lib/clip-storage";
import {
  detectMistakeHighlight,
  drawAnnotatedClipFrame,
  encodeSlowMoClipVideo,
  isRealTrickMotion,
  renderMistakePosterDataUrl,
  type ClipFrame,
  type SavedClip,
} from "@/lib/clips";
import type { DeckSetupId } from "@/lib/setup";
import type { AnalyzerPhase, Attempt, Tips } from "@/lib/trick-analyzer";
import type { TrickId } from "@/lib/tricks";

const MAX_PREROLL_FRAMES = 10;
const MAX_CAPTURE_FRAMES = 72;
const MAX_SAVED_CLIPS = 10;
const CAPTURE_INTERVAL_MS = 32; // ~30fps capture ceiling
const LAND_FOLLOWTHROUGH_FRAMES = 4;
const MAX_CAPTURE_WIDTH = 480;

interface PreRollSlot {
  canvas: HTMLCanvasElement;
  timeMs: number;
  tips: Tips;
  boardPitchDeg: number;
  flipDeg: number;
  wristRotDeg: number;
}

interface ActiveCapture {
  popAtMs: number;
  lastCaptureAtMs: number;
  frames: ClipFrame[];
  canvases: HTMLCanvasElement[];
  width: number;
  height: number;
  mirrored: boolean;
  pendingLandLeft: number;
  completedAttempt: Attempt | null;
  trickName: string;
  boardScale: number;
}

function captureSizeOf(video: HTMLVideoElement): { width: number; height: number } {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 360;
  const width = Math.min(MAX_CAPTURE_WIDTH, vw);
  const height = Math.max(120, Math.round((width / Math.max(1, vw)) * vh));
  return { width, height };
}

function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const copy = document.createElement("canvas");
  copy.width = src.width;
  copy.height = src.height;
  const ctx = copy.getContext("2d");
  if (ctx) ctx.drawImage(src, 0, 0);
  return copy;
}

async function imageBlobToCanvas(
  blob: Blob | null,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context || !blob) return canvas;
  try {
    const bitmap = await createImageBitmap(blob);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas;
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Stored clip frame could not be decoded"));
      });
      context.drawImage(image, 0, 0, width, height);
    } catch {
      // Keep a blank frame; the saved video and clip metadata remain usable.
    } finally {
      URL.revokeObjectURL(url);
    }
    return canvas;
  }
}

function drawVideoToCanvas(
  video: HTMLVideoElement,
  width: number,
  height: number,
  target?: HTMLCanvasElement,
): HTMLCanvasElement | null {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }
  const canvas = target ?? document.createElement("canvas");
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return canvas;
}

export interface ClipSampleInput {
  now: number;
  prevPhase: AnalyzerPhase;
  nextPhase: AnalyzerPhase;
  attempt: Attempt | null;
  tips: Tips | null;
  mirrored: boolean;
  trickId: TrickId;
  trickName: string;
  setup: DeckSetupId;
  boardScale: number;
  boardTelemetry: BoardTrackTelemetry | null;
  liveFlipDeg: number;
  wristRotDeg: number;
}

/**
 * Event-triggered video clip recorder: keeps only a tiny circular pre-roll in memory
 * while a hand is present and ONLY saves slow-motion video clips when background tracking
 * detects a genuine trick-like pop and flick motion.
 */
export function useClipRecorder(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraLive: boolean,
) {
  const [clips, setClips] = useState<SavedClip[]>([]);
  const [recordingAir, setRecordingAir] = useState(false);

  const frameStoreRef = useRef<Map<string, HTMLCanvasElement[]>>(new Map());
  const preRollRef = useRef<PreRollSlot[]>([]);
  const preRollWriteIdxRef = useRef(0);
  const lastPreRollAtRef = useRef(0);
  const activeRef = useRef<ActiveCapture | null>(null);
  const clipSeqRef = useRef(1);
  const mountedRef = useRef(true);
  const clipsRef = useRef<SavedClip[]>([]);
  const pendingPersistIdsRef = useRef<Set<string>>(new Set());
  const deletedDuringPersistRef = useRef<Set<string>>(new Set());
  clipsRef.current = clips;

  useEffect(() => {
    let cancelled = false;
    void loadClipRecords().then(async (records) => {
      const restored: SavedClip[] = [];
      for (const record of records) {
        const clip = record.clip as SavedClip;
        const frameCanvases = await Promise.all(
          record.frameImages.map((blob) => imageBlobToCanvas(blob, clip.width, clip.height)),
        );
        if (cancelled) {
          for (const restoredClip of restored) {
            if (restoredClip.videoUrl) URL.revokeObjectURL(restoredClip.videoUrl);
          }
          return;
        }
        if (frameCanvases.length > 0) frameStoreRef.current.set(clip.id, frameCanvases);
        const restoredClip: SavedClip = {
          ...clip,
          ...(!clip.videoBlob && clip.exportState === "encoding" ? { exportState: "fallback" as const } : {}),
          ...(clip.videoBlob ? { videoUrl: URL.createObjectURL(clip.videoBlob) } : {}),
        };
        restored.push(restoredClip);
      }
      if (!cancelled && restored.length > 0) {
        setClips((current) => {
          const merged = [...current, ...restored];
          const unique = Array.from(new Map(merged.map((clip) => [clip.id, clip])).values());
          return unique.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_SAVED_CLIPS);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const store = frameStoreRef.current;
    return () => {
      mountedRef.current = false;
      for (const c of clipsRef.current) {
        if (c.videoUrl) URL.revokeObjectURL(c.videoUrl);
      }
      store.clear();
    };
  }, []);

  useEffect(() => {
    if (cameraLive) return;
    // Never splice stale pre-roll or a half-finished attempt into the next session.
    activeRef.current = null;
    preRollRef.current = [];
    preRollWriteIdxRef.current = 0;
    lastPreRollAtRef.current = 0;
    setRecordingAir(false);
  }, [cameraLive]);

  const getFrameSource = useCallback(
    (clipId: string, frameIndex: number): HTMLCanvasElement | null => {
      const arr = frameStoreRef.current.get(clipId);
      if (!arr) return null;
      return arr[frameIndex] ?? null;
    },
    [],
  );

  const persistClipState = useCallback(async (
    clip: SavedClip,
    initialSave: Promise<boolean>,
    pendingVideoUrl?: string,
  ) => {
    await initialSave;
    // Deleting an item while its frame stills are being encoded can race the
    // first IndexedDB put. Run a second delete after all pending writes settle.
    if (deletedDuringPersistRef.current.has(clip.id)) {
      await deleteClipRecord(clip.id);
      if (pendingVideoUrl) URL.revokeObjectURL(pendingVideoUrl);
    } else {
      await updateStoredClip(clip);
      if (deletedDuringPersistRef.current.has(clip.id)) {
        await deleteClipRecord(clip.id);
        if (pendingVideoUrl) URL.revokeObjectURL(pendingVideoUrl);
      }
    }
    pendingPersistIdsRef.current.delete(clip.id);
    deletedDuringPersistRef.current.delete(clip.id);
  }, []);

  const finalizeActiveCapture = useCallback((cap: ActiveCapture) => {
    const attempt = cap.completedAttempt;
    if (!attempt || cap.frames.length < 2) {
      setRecordingAir(false);
      return;
    }

    const clipId = `clip-${Date.now()}-${clipSeqRef.current++}`;
    pendingPersistIdsRef.current.add(clipId);
    const frames = cap.frames;
    const canvases = cap.canvases;

    frameStoreRef.current.set(clipId, canvases);
    const getSrc = (idx: number) => canvases[idx] ?? null;

    const mistake = detectMistakeHighlight(frames, attempt);
    const firstT = frames[0]?.tMs ?? 0;
    const lastT = frames[frames.length - 1]?.tMs ?? 0;
    const durationMs = Math.max(120, lastT - firstT);

    const baseClip: SavedClip = {
      id: clipId,
      createdAt: Date.now(),
      trickId: attempt.trickId as TrickId,
      trickName: cap.trickName,
      ...(attempt.setup ? { setup: attempt.setup } : {}),
      mirrored: cap.mirrored,
      width: cap.width,
      height: cap.height,
      durationMs,
      attempt,
      frames,
      mistake,
      posterUrl: "",
      exportState: "encoding",
    };

    baseClip.posterUrl = renderMistakePosterDataUrl(baseClip, getSrc);

    setClips((prev) => {
      const next = [baseClip, ...prev];
      if (next.length > MAX_SAVED_CLIPS) {
        const evicted = next.splice(MAX_SAVED_CLIPS);
        for (const old of evicted) {
          if (old.videoUrl) URL.revokeObjectURL(old.videoUrl);
          frameStoreRef.current.delete(old.id);
          if (pendingPersistIdsRef.current.has(old.id)) deletedDuringPersistRef.current.add(old.id);
          void deleteClipRecord(old.id);
        }
      }
      return next;
    });
    setRecordingAir(false);
    const saveInitial = saveClipRecord(baseClip, canvases);

    // Encode slow-motion annotated video asynchronously without blocking UI or camera tracking.
    void encodeSlowMoClipVideo(baseClip, getSrc).then(async (encoded) => {
      if (!mountedRef.current) return;
      if (!encoded) {
        const fallbackClip: SavedClip = { ...baseClip, exportState: "fallback" };
        setClips((prev) => prev.map((c) => (c.id === clipId ? fallbackClip : c)));
        await persistClipState(fallbackClip, saveInitial);
        return;
      }
      const videoUrl = URL.createObjectURL(encoded.blob);
      const readyClip: SavedClip = {
        ...baseClip,
        videoBlob: encoded.blob,
        videoUrl,
        videoMimeType: encoded.mimeType,
        exportState: "ready",
      };
      setClips((prev) => prev.map((c) => (c.id === clipId ? readyClip : c)));
      await persistClipState(readyClip, saveInitial, videoUrl);
    }).catch(async () => {
      // MediaRecorder/canvas encoding can fail on unsupported mobile browsers or
      // when the page loses resources. Keep the annotated frame replay either way.
      if (!mountedRef.current) return;
      const fallbackClip: SavedClip = { ...baseClip, exportState: "fallback" };
      setClips((prev) => prev.map((clip) => (clip.id === clipId ? fallbackClip : clip)));
      await persistClipState(fallbackClip, saveInitial);
    });
  }, [persistClipState]);

  const syncSample = useCallback(
    (input: ClipSampleInput) => {
      if (!cameraLive) return;
      const video = videoRef.current;
      if (!video) return;

      const {
        now,
        prevPhase,
        nextPhase,
        attempt,
        tips,
        mirrored,
        trickName,
        boardScale,
        boardTelemetry,
        liveFlipDeg,
        wristRotDeg,
      } = input;

      const pitchDeg = boardTelemetry?.detected ? Math.round(boardTelemetry.pitchDeg * 10) / 10 : 0;

      // 1. If we are capturing post-landing settle frames for a confirmed trick clip
      const active = activeRef.current;
      if (active && active.completedAttempt) {
        if (tips && now - active.lastCaptureAtMs >= CAPTURE_INTERVAL_MS * 0.75) {
          const shot = drawVideoToCanvas(video, active.width, active.height);
          if (shot) {
            active.canvases.push(shot);
            active.frames.push({
              tMs: Math.round(now - active.popAtMs),
              phase: "land",
              index: { ...tips.index },
              middle: { ...tips.middle },
              boardPitchDeg: pitchDeg,
              flipDeg: liveFlipDeg,
              wristRotDeg,
            });
            active.lastCaptureAtMs = now;
            active.pendingLandLeft -= 1;
          }
        }
        if (active.pendingLandLeft <= 0 || now - active.lastCaptureAtMs > 180) {
          activeRef.current = null;
          finalizeActiveCapture(active);
        }
        return;
      }

      // 2. Pop triggered: rest -> air
      if (prevPhase === "rest" && nextPhase === "air" && tips) {
        const { width, height } = captureSizeOf(video);
        const sortedPre = [...preRollRef.current].sort((a, b) => a.timeMs - b.timeMs);
        const frames: ClipFrame[] = [];
        const canvases: HTMLCanvasElement[] = [];

        for (const slot of sortedPre) {
          if (now - slot.timeMs > 420) continue;
          canvases.push(cloneCanvas(slot.canvas));
          frames.push({
            tMs: Math.round(slot.timeMs - now),
            phase: "pre",
            index: { ...slot.tips.index },
            middle: { ...slot.tips.middle },
            boardPitchDeg: slot.boardPitchDeg,
            flipDeg: slot.flipDeg,
            wristRotDeg: slot.wristRotDeg,
          });
        }

        const firstShot = drawVideoToCanvas(video, width, height);
        if (firstShot) {
          canvases.push(firstShot);
          frames.push({
            tMs: 0,
            phase: "air",
            index: { ...tips.index },
            middle: { ...tips.middle },
            boardPitchDeg: pitchDeg,
            flipDeg: liveFlipDeg,
            wristRotDeg,
          });
        }

        activeRef.current = {
          popAtMs: now,
          lastCaptureAtMs: now,
          frames,
          canvases,
          width,
          height,
          mirrored,
          pendingLandLeft: 0,
          completedAttempt: null,
          trickName,
          boardScale,
        };
        setRecordingAir(true);
        return;
      }

      // 3. Airborne capture
      if (active && nextPhase === "air" && tips) {
        if (
          active.frames.length < MAX_CAPTURE_FRAMES &&
          now - active.lastCaptureAtMs >= CAPTURE_INTERVAL_MS * 0.8
        ) {
          const shot = drawVideoToCanvas(video, active.width, active.height);
          if (shot) {
            active.canvases.push(shot);
            active.frames.push({
              tMs: Math.round(now - active.popAtMs),
              phase: "air",
              index: { ...tips.index },
              middle: { ...tips.middle },
              boardPitchDeg: pitchDeg,
              flipDeg: liveFlipDeg,
              wristRotDeg,
            });
            active.lastCaptureAtMs = now;
          }
        }
        return;
      }

      // 4. Touchdown / Completion or Abort
      if (active && prevPhase === "air" && nextPhase === "rest") {
        if (attempt && isRealTrickMotion(attempt, boardScale)) {
          // Append touchdown frame immediately if we haven't captured this timestamp yet
          if (tips) {
            const shot = drawVideoToCanvas(video, active.width, active.height);
            if (shot) {
              active.canvases.push(shot);
              active.frames.push({
                tMs: Math.round(now - active.popAtMs),
                phase: "land",
                index: { ...tips.index },
                middle: { ...tips.middle },
                boardPitchDeg: pitchDeg,
                flipDeg: liveFlipDeg,
                wristRotDeg,
              });
              active.lastCaptureAtMs = now;
            }
          }
          active.completedAttempt = attempt;
          active.pendingLandLeft = LAND_FOLLOWTHROUGH_FRAMES;
          return;
        }

        // Did NOT meet real pop + flick threshold (or aborted): discard cleanly.
        activeRef.current = null;
        setRecordingAir(false);
        return;
      }

      // 5. Idle pre-roll ring buffer (ONLY when hand tips are present)
      if (nextPhase === "rest" && tips && now - lastPreRollAtRef.current >= CAPTURE_INTERVAL_MS) {
        const { width, height } = captureSizeOf(video);
        const idx = preRollWriteIdxRef.current % MAX_PREROLL_FRAMES;
        const existing = preRollRef.current[idx];
        const canvas = drawVideoToCanvas(video, width, height, existing?.canvas);
        if (canvas) {
          preRollRef.current[idx] = {
            canvas,
            timeMs: now,
            tips: { index: { ...tips.index }, middle: { ...tips.middle } },
            boardPitchDeg: pitchDeg,
            flipDeg: liveFlipDeg,
            wristRotDeg,
          };
          preRollWriteIdxRef.current = idx + 1;
          lastPreRollAtRef.current = now;
        }
      }
    },
    [cameraLive, videoRef, finalizeActiveCapture],
  );

  // Flush any pending follow-through capture cleanly if hand disappears briefly after landing
  useEffect(() => {
    if (!cameraLive) return;
    const id = setInterval(() => {
      const active = activeRef.current;
      if (active?.completedAttempt && performance.now() - active.lastCaptureAtMs > 170) {
        activeRef.current = null;
        finalizeActiveCapture(active);
      }
    }, 90);
    return () => clearInterval(id);
  }, [cameraLive, finalizeActiveCapture]);

  const cancelPendingAttempt = useCallback(() => {
    // Switching tricks or leaving a session invalidates an unfinished capture.
    activeRef.current = null;
    preRollRef.current = [];
    preRollWriteIdxRef.current = 0;
    lastPreRollAtRef.current = 0;
    setRecordingAir(false);
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    if (pendingPersistIdsRef.current.has(clipId)) deletedDuringPersistRef.current.add(clipId);
    void deleteClipRecord(clipId);
    setClips((prev) => {
      const target = prev.find((c) => c.id === clipId);
      if (target?.videoUrl) URL.revokeObjectURL(target.videoUrl);
      frameStoreRef.current.delete(clipId);
      return prev.filter((c) => c.id !== clipId);
    });
  }, []);

  const exportClipFramePng = useCallback(
    async (clip: SavedClip, frameIndex: number): Promise<Blob | null> => {
      const canvas = document.createElement("canvas");
      canvas.width = clip.width;
      canvas.height = clip.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      drawAnnotatedClipFrame(
        ctx,
        canvas.width,
        canvas.height,
        clip,
        frameIndex,
        getFrameSource(clip.id, frameIndex),
        { showHudBadge: true, animPhase: 0 },
      );
      return new Promise<Blob | null>((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/png"),
      );
    },
    [getFrameSource],
  );

  return {
    clips,
    recordingAir,
    syncSample,
    cancelPendingAttempt,
    getFrameSource,
    deleteClip,
    exportClipFramePng,
  };
}
