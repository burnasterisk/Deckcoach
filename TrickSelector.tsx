import { ChevronUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getTrick,
  getTricksByCategory,
  TRICKS,
  TRICK_CATEGORIES,
  type TrickCategory,
  type TrickId,
} from "@/lib/tricks";
import { cn } from "@/lib/utils";

interface TrickSelectorProps {
  value: TrickId;
  onChange: (id: TrickId) => void;
  /** Closes the category trick tray when the control bar auto-hides. */
  hudHidden?: boolean;
}

export function TrickSelector({ value, onChange, hudHidden = false }: TrickSelectorProps) {
  const activeTrick = getTrick(value);
  const [open, setOpen] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<TrickCategory>(activeTrick.category);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setBrowseCategory(activeTrick.category);
  }, [activeTrick.category]);

  useEffect(() => {
    if (hudHidden) setOpen(false);
  }, [hudHidden]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const query = search.trim().toLowerCase();
  const categoryTricks = query
    ? TRICKS.filter((trick) =>
        `${trick.name} ${trick.short} ${trick.category}`.toLowerCase().includes(query),
      )
    : getTricksByCategory(browseCategory);

  return (
    <div ref={containerRef} className="relative min-w-0">
      {/* Floating category trick drawer positioned cleanly above the bottom HUD bar */}
      {open && (
        <div
          role="dialog"
          aria-label="Choose fingerboard trick"
          className="hud-glass absolute bottom-full left-0 z-40 mb-2.5 max-h-[78dvh] w-[min(92vw,34rem)] animate-slap overflow-y-auto rounded-xl p-3 text-paper"
        >
          <div className="flex items-center justify-between gap-2 border-b border-paper/10 pb-2">
            <div
              role="tablist"
              aria-label="Trick categories"
              className="no-scrollbar flex items-center gap-1 overflow-x-auto"
            >
              {TRICK_CATEGORIES.map((cat) => {
                const isSelected = cat.id === browseCategory;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => { setBrowseCategory(cat.id); setSearch(""); }}
                    className={cn(
                      "min-h-[36px] shrink-0 rounded-md px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "bg-primary/15 font-bold text-primary"
                        : "text-paper/65 hover:bg-paper/10 hover:text-paper",
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <span className="shrink-0 pl-1 font-mono text-[9px] text-paper/35">{TRICKS.length} TRICKS</span>

            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(""); }}
              aria-label="Close trick list"
              className="grid size-9 shrink-0 place-items-center rounded-md text-paper/60 transition-colors cursor-pointer hover:bg-paper/10 hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-4" />
            </button>
          </div>

          <label className="mt-2.5 flex h-10 items-center gap-2 border border-paper/12 bg-black/40 px-3 focus-within:border-primary/55">
            <span className="font-mono text-[9px] text-paper/35">FIND</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the trick library…"
              aria-label="Search fingerboard tricks"
              className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-paper outline-none placeholder:text-paper/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear trick search"
                className="grid size-6 place-items-center text-paper/45 hover:text-paper"
              >
                <X className="size-3" />
              </button>
            )}
          </label>

          <div
            role="radiogroup"
            aria-label={query ? "Matching fingerboard tricks" : `${TRICK_CATEGORIES.find((c) => c.id === browseCategory)?.label ?? ""} tricks`}
            className="mt-2.5 grid max-h-[42dvh] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-3"
          >
            {categoryTricks.map((t) => {
              const isActive = t.id === value;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex min-h-[44px] flex-col items-start justify-center rounded-lg border px-2.5 py-1.5 text-left transition-colors cursor-pointer press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-paper/10 bg-black/35 text-paper/85 hover:border-paper/30 hover:text-paper",
                  )}
                >
                  <span
                    className={cn(
                      "w-full truncate font-mono text-xs",
                      isActive && "font-marker text-[13px] tracking-wide",
                    )}
                  >
                    {t.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] tabular-nums text-paper/50">
                    <span>{t.short}</span>
                    {query && <><span aria-hidden="true">·</span><span className="uppercase">{t.category}</span></>}
                    <span aria-hidden="true">·</span>
                    <span className="text-hazard">
                      {"■".repeat(t.difficulty)}
                      <span className="text-paper/20">{"■".repeat(5 - t.difficulty)}</span>
                    </span>
                  </span>
                </button>
              );
            })}
            {categoryTricks.length === 0 && (
              <p className="col-span-full py-7 text-center font-mono text-[11px] text-paper/40">
                NO MATCHES. Try another trick name.
              </p>
            )}
          </div>

          {activeTrick.technique && (
            <section className="mt-3 border-t border-paper/12 pt-3" aria-label={`${activeTrick.name} technique notes`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-mono text-[9px] font-bold tracking-[.2em] text-primary">TECHNIQUE NOTES</p>
                <p className="font-mono text-[9px] text-paper/40">{activeTrick.difficulty}/5 · {activeTrick.category.toUpperCase()}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["SETUP", activeTrick.technique.setup],
                  ["EXECUTION", activeTrick.technique.execution],
                  ["TIMING", activeTrick.technique.timing],
                  ["CATCH / EXIT", activeTrick.technique.catch],
                ] as const).map(([label, detail]) => (
                  <div key={label} className="border-l border-uv/55 bg-black/25 py-1 pl-2 pr-1">
                    <p className="font-mono text-[9px] font-bold tracking-wider text-paper/45">{label}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-paper/78">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-mono text-[9px] leading-relaxed text-hazard/85">
                WATCH FOR: {activeTrick.technique.commonFaults.join(" · ")}
              </p>
            </section>
          )}
        </div>
      )}

      {/* Slim inline bar: Active Trick dropdown button + 4 category quick-tabs */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`Selected trick: ${activeTrick.name}. Change trick`}
          onClick={() => { if (!open) setSearch(""); setOpen((prev) => !prev); }}
          className={cn(
            "flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs whitespace-nowrap transition-colors cursor-pointer press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            open
              ? "border-primary bg-primary/20 text-primary"
              : "border-primary/45 bg-primary/12 text-primary hover:bg-primary/20",
          )}
        >
          <span className="font-marker text-sm tracking-wide">{activeTrick.name}</span>
          <ChevronUp
            className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")}
          />
        </button>

        <span className="mx-0.5 h-4 w-px shrink-0 bg-paper/15" aria-hidden="true" />

        {TRICK_CATEGORIES.map((cat) => {
          const isCurrentCategory = activeTrick.category === cat.id;
          const isBrowsing = open && browseCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setBrowseCategory(cat.id);
                setOpen(true);
              }}
              className={cn(
                "relative flex min-h-[40px] shrink-0 items-center px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap rounded-md transition-colors cursor-pointer press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isBrowsing
                  ? "bg-paper/15 font-bold text-primary"
                  : isCurrentCategory
                    ? "bg-paper/8 font-bold text-paper"
                    : "text-paper/65 hover:bg-paper/10 hover:text-paper",
              )}
            >
              <span>{cat.label}</span>
              {isCurrentCategory && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-primary/80"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
