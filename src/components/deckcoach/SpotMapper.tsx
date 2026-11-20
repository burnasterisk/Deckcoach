import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from "react";
import { Camera, Crosshair, Ruler, ScanLine, Trash2, X } from "lucide-react";

import { getObstacleAdvice, measureObstacle, type ObstacleKind, type ObstacleMap } from "@/lib/obstacle-maps";
import type { BoardCalibration } from "@/lib/board-calibration";
import { cn } from "@/lib/utils";

interface SpotMapperProps {
  open: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  boardLock: BoardCalibration | null;
  boardLengthMm: number;
  mirrored: boolean;
  maps: ObstacleMap[];
  activeMapId: string | null;
  onSelectMap: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
  onSave: (map: ObstacleMap) => void;
  onClose: () => void;
  onLockBoard: () => void;
}

const TYPES: { id: ObstacleKind; label: string }[] = [
  { id: "rail", label: "RAIL" },
  { id: "ledge", label: "LEDGE" },
  { id: "gap", label: "GAP" },
  { id: "ramp", label: "RAMP" },
  { id: "box", label: "BOX" },
  { id: "manual-pad", label: "PAD" },
];

type Point = { x: number; y: number };

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function SpotMapper({
  open,
  videoRef,
  boardLock,
  boardLengthMm,
  mirrored,
  maps,
  activeMapId,
  onSelectMap,
  onDeleteMap,
  onSave,
  onClose,
  onLockBoard,
}: SpotMapperProps) {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [name, setName] = useState("My spot");
  const [kind, setKind] = useState<ObstacleKind>("ledge");
  const [depthMm, setDepthMm] = useState(0);
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);
  const [selecting, setSelecting] = useState(false);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const captureSnapshot = useCallback(() => {
    setCaptureError(null);
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setSnapshot(null);
      setCaptureError("Camera frame unavailable. Wait for the camera, then try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setSnapshot(null);
      setCaptureError("Snapshot canvas is unavailable in this browser.");
      return;
    }
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setSnapshot(canvas.toDataURL("image/jpeg", 0.72));
    } catch {
      setSnapshot(null);
      setCaptureError("Could not capture this camera frame. Try again.");
    }
  }, [videoRef]);

  useEffect(() => {
    if (!open) return;
    setStart(null);
    setEnd(null);
    setSnapshot(null);
    captureSnapshot();
  }, [open, captureSnapshot]);

  function closeMapper() {
    setSnapshot(null);
    setStart(null);
    setEnd(null);
    setSelecting(false);
    setCaptureError(null);
    onClose();
  }

  const selection = useMemo(() => {
    if (!start || !end) return null;
    return {
      left: Math.min(start.x, end.x),
      top: Math.min(start.y, end.y),
      width: Math.abs(start.x - end.x),
      height: Math.abs(start.y - end.y),
    };
  }, [start, end]);

  const measurement = useMemo(() => {
    if (!selection || !boardLock || selection.width < 8 || selection.height < 8) return null;
    return measureObstacle({
      widthPx: selection.width,
      heightPx: selection.height,
      boardLengthPx: boardLock.deckLengthPx,
      boardLengthMm,
      depthMm,
    });
  }, [selection, boardLock, boardLengthMm, depthMm]);

  const advice = measurement ? getObstacleAdvice({ kind, widthDecks: measurement.widthDecks, heightDecks: measurement.heightDecks }) : null;

  function pointFromEvent(event: PointerEvent<HTMLDivElement>): Point | null {
    const bounds = areaRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
    return {
      x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
      y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // Controls sit above the full-screen drawing layer; never start a measurement
    // when the user is interacting with those inputs/buttons.
    if ((event.target as HTMLElement).closest("[data-spot-controls]")) return;
    if (!snapshot || !boardLock) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setStart(point);
    setEnd(point);
    setSelecting(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!selecting) return;
    const point = pointFromEvent(event);
    if (point) setEnd(point);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!selecting) return;
    const point = pointFromEvent(event);
    if (point) setEnd(point);
    setSelecting(false);
  }

  function handleSave() {
    if (!measurement) return;
    onSave({
      id: `spot-${Date.now()}`,
      name: name.trim() || `${TYPES.find((t) => t.id === kind)?.label ?? "SPOT"} spot`,
      kind,
      ...measurement,
      createdAt: Date.now(),
    });
    closeMapper();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 text-paper" role="dialog" aria-modal="true" aria-label="Spot mapper">
      <div
        ref={areaRef}
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setSelecting(false)}
      >
        {snapshot ? (
          <img
            src={snapshot}
            alt="Frozen camera view for obstacle measurement"
            className={cn("pointer-events-none h-full w-full select-none object-cover", mirrored && "-scale-x-100")}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#15121b]">
            <div className="flex max-w-sm flex-col items-center gap-2 text-center">
              <Camera className="size-8 text-hazard" />
              <p className="font-display text-2xl">NO SNAPSHOT</p>
              <p className="font-mono text-xs leading-relaxed text-paper/60">{captureError ?? "Start the camera to map a spot."}</p>
            </div>
          </div>
        )}
        {selection && (
          <div
            className="pointer-events-none absolute border-2 border-hazard bg-hazard/15 shadow-[0_0_0_1px_#08080a,0_0_22px_#facc1544]"
            style={{ left: selection.left, top: selection.top, width: selection.width, height: selection.height }}
          >
            <span className="absolute -top-6 left-0 whitespace-nowrap bg-hazard px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">
              MARKED OBSTACLE
            </span>
            <span className="absolute -bottom-6 right-0 whitespace-nowrap bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-hazard">
              {measurement ? `${measurement.widthMm} × ${measurement.heightMm} mm` : "DRAG TO SIZE"}
            </span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-gradient-to-b from-black/85 to-transparent px-3 pb-16 pt-safe">
        <section data-spot-controls className="pointer-events-auto mt-3 w-full max-w-2xl border border-paper/15 bg-[#0b090d]/90 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] font-bold tracking-[.25em] text-primary">DECKCOACH / SPOT MAPPER</p>
              <h2 className="mt-1 font-display text-2xl leading-none">Mark your obstacle.</h2>
              <p className="mt-1 max-w-lg font-mono text-[10px] leading-relaxed text-paper/55">Draw a box around the visible obstacle. Size is estimated against your locked deck length; camera perspective can affect accuracy.</p>
            </div>
            <button type="button" onClick={closeMapper} aria-label="Close spot mapper" className={cn("grid size-9 shrink-0 place-items-center border border-paper/15 bg-black/40 text-paper/60 hover:text-paper", focusRing)}><X className="size-4" /></button>
          </div>

          {!snapshot && captureError && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-hazard/25 bg-hazard/5 px-3 py-2">
              <p className="font-mono text-[9px] text-paper/60">{captureError}</p>
              <button type="button" onClick={captureSnapshot} className={cn("min-h-9 border border-hazard/45 px-3 font-mono text-[9px] font-bold text-hazard", focusRing)}>TRY CAMERA AGAIN</button>
            </div>
          )}

          {!boardLock ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-hazard/30 bg-hazard/8 px-3 py-2">
              <p className="font-mono text-[10px] text-paper/75">Lock your board first so the camera has a real size reference.</p>
              <button
                type="button"
                onClick={() => {
                  closeMapper();
                  onLockBoard();
                }}
                className={cn("min-h-9 bg-hazard px-3 font-mono text-[10px] font-bold text-black", focusRing)}
              >
                LOCK BOARD
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="col-span-2">
                <span className="mb-1 block font-mono text-[9px] text-paper/45">SPOT NAME</span>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} className="h-9 w-full border border-paper/15 bg-black/50 px-2 font-mono text-xs text-paper outline-none focus:border-primary" />
              </label>
              <label className="col-span-2">
                <span className="mb-1 block font-mono text-[9px] text-paper/45">OBSTACLE TYPE</span>
                <select value={kind} onChange={(event) => setKind(event.target.value as ObstacleKind)} className="h-9 w-full border border-paper/15 bg-[#151019] px-2 font-mono text-xs text-paper outline-none focus:border-primary">
                  {TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </label>
            </div>
          )}

          {boardLock && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-paper/10 pt-2">
              <p className="flex items-center gap-1.5 font-mono text-[9px] text-paper/55"><Ruler className="size-3 text-uv" /> SCALE REF · {boardLengthMm}MM DECK · {Math.round(boardLock.deckLengthPx)}PX</p>
              <p className="font-mono text-[9px] text-hazard">{selection ? "Release to finish selection" : "DRAG A BOX ON THE SCREEN"}</p>
            </div>
          )}

          {measurement && advice && (
            <div className="mt-3 grid gap-2 border-t border-paper/10 pt-3 sm:grid-cols-[.8fr_1.2fr]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-paper/5 p-2"><p className="font-mono text-[8px] text-paper/45">WIDTH</p><p className="font-display text-xl">{measurement.widthMm}<span className="ml-1 font-mono text-[9px]">MM</span></p></div>
                <div className="bg-paper/5 p-2"><p className="font-mono text-[8px] text-paper/45">HEIGHT</p><p className="font-display text-xl">{measurement.heightMm}<span className="ml-1 font-mono text-[9px]">MM</span></p></div>
                <label className="col-span-2 bg-paper/5 p-2">
                  <span className="block font-mono text-[8px] text-paper/45">DEPTH ESTIMATE · MANUAL</span>
                  <span className="mt-1 flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={5}
                      value={depthMm}
                      onChange={(event) => setDepthMm(Number(event.target.value))}
                      className="min-w-0 flex-1 accent-[#8b5cf6]"
                      aria-label="Estimated obstacle depth in millimetres"
                    />
                    <strong className="w-16 text-right font-mono text-xs tabular-nums text-paper">{depthMm ? `${depthMm} mm` : "unknown"}</strong>
                  </span>
                </label>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-bold text-primary">SPOT READ</p>
                <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-paper/75">{advice.summary}</p>
                <p className="mt-1 font-mono text-[9px] leading-relaxed text-hazard/80">{advice.warning}</p>
                <p className="mt-1 font-mono text-[9px] text-paper/50">TRY: {advice.suggestedTricks.join(" · ")}</p>
              </div>
            </div>
          )}

          {maps.length > 0 && (
            <div className="mt-3 border-t border-paper/10 pt-3">
              <p className="mb-2 font-mono text-[9px] font-bold tracking-[.18em] text-paper/45">SAVED SPOTS · {maps.length}</p>
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {maps.map((map) => (
                  <div key={map.id} className={cn("flex min-h-8 items-center border text-[9px]", map.id === activeMapId ? "border-primary/55 bg-primary/12" : "border-paper/12 bg-black/35")}>
                    <button type="button" onClick={() => onSelectMap(map.id)} className="px-2 py-1 text-left font-mono text-paper/80 hover:text-paper" aria-pressed={map.id === activeMapId}>
                      {map.name} · {map.widthMm}×{map.heightMm}mm
                      {map.depthMm > 0 ? ` · D${map.depthMm}` : " · D?"}
                    </button>
                    <button type="button" onClick={() => onDeleteMap(map.id)} aria-label={`Delete saved spot ${map.name}`} className="grid size-7 place-items-center text-paper/35 hover:text-hazard">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[9px] text-paper/40">2D CAMERA SCALE + OPTIONAL MANUAL DEPTH · LOCAL ONLY</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setStart(null); setEnd(null); }} className={cn("min-h-10 px-3 font-mono text-[10px] text-paper/60 hover:text-paper", focusRing)}>RESET BOX</button>
              <button type="button" onClick={handleSave} disabled={!measurement || !snapshot} className={cn("flex min-h-10 items-center gap-1.5 bg-primary px-4 font-mono text-[10px] font-bold text-white disabled:opacity-35", focusRing)}>
                <Crosshair className="size-3.5" /> SAVE SPOT MAP
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent px-3 pb-safe pt-12">
        <p className="font-mono text-[9px] tracking-wider text-paper/55"><ScanLine className="mr-1 inline size-3 text-uv" /> TOUCH AND DRAG TO TRACE THE OBSTACLE BOUNDING BOX</p>
      </div>
    </div>
  );
}
