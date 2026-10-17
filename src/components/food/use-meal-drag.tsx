"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MealType } from "@/lib/meals";

/*
 * Drag something onto a meal section (any element with data-meal="breakfast" etc.).
 * HTML5 drag-and-drop doesn't work with touch, so this uses pointer events:
 *   - mouse: drag starts once the pointer moves a few pixels
 *   - touch: press and hold (~350 ms) first, so normal scrolling and tapping still work
 * While dragging, the page auto-scrolls near the top/bottom edge.
 */

const HOLD_MS = 350;
const MOVE_TOLERANCE = 8;
const EDGE = 90;

export type DragState<T> = { item: T; label: string; x: number; y: number; over: MealType | null };

function mealAt(x: number, y: number): MealType | null {
  const el = document.elementFromPoint(x, y)?.closest("[data-meal]");
  return (el?.getAttribute("data-meal") as MealType | null) ?? null;
}

export function useMealDrag<T>(onDrop: (item: T, meal: MealType) => void) {
  const [drag, setDrag] = useState<DragState<T> | null>(null);
  const suppressClick = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const bind = useCallback((item: T, label: string) => {
    return {
      onPointerDown(e: React.PointerEvent) {
        if (e.button !== 0) return;
        cleanupRef.current?.();
        const startX = e.clientX;
        const startY = e.clientY;
        const isMouse = e.pointerType === "mouse";
        let started = false;
        let current: DragState<T> | null = null;
        let holdTimer: ReturnType<typeof setTimeout> | undefined;

        // Stop the page from scrolling under a touch drag (needs a non-passive listener).
        const blockTouchScroll = (ev: TouchEvent) => {
          if (started) ev.preventDefault();
        };

        const begin = (x: number, y: number) => {
          started = true;
          navigator.vibrate?.(25);
          current = { item, label, x, y, over: mealAt(x, y) };
          setDrag(current);
        };

        const move = (ev: PointerEvent) => {
          const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
          if (!started) {
            if (dist > MOVE_TOLERANCE) {
              if (isMouse) begin(ev.clientX, ev.clientY);
              else cleanup(); // finger moved before the hold finished: it's a scroll
            }
            return;
          }
          if (ev.clientY < EDGE) window.scrollBy(0, -12);
          else if (ev.clientY > window.innerHeight - EDGE) window.scrollBy(0, 12);
          current = { ...current!, x: ev.clientX, y: ev.clientY, over: mealAt(ev.clientX, ev.clientY) };
          setDrag(current);
        };

        const up = () => {
          if (started && current) {
            suppressClick.current = true; // the click that follows pointerup is not a tap
            if (current.over) onDropRef.current(current.item, current.over);
          }
          cleanup();
        };

        function cleanup() {
          clearTimeout(holdTimer);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", cleanup);
          document.removeEventListener("touchmove", blockTouchScroll);
          cleanupRef.current = null;
          setDrag(null);
        }

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", cleanup);
        document.addEventListener("touchmove", blockTouchScroll, { passive: false });
        if (!isMouse) holdTimer = setTimeout(() => begin(startX, startY), HOLD_MS);
        cleanupRef.current = cleanup;
      },
      onClickCapture(e: React.MouseEvent) {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      },
      // Long-press would otherwise open the phone's context menu / text selection.
      onContextMenu(e: React.MouseEvent) {
        e.preventDefault();
      },
      style: { WebkitTouchCallout: "none", userSelect: "none" } as React.CSSProperties,
    };
  }, []);

  return { drag, bind };
}

/** The floating label that follows the finger / cursor. */
export function DragGhost({ drag, overLabel }: { drag: DragState<unknown> | null; overLabel: string | null }) {
  if (!drag) return null;
  return (
    <div
      className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[130%] rounded-xl border border-[var(--accent)] bg-[var(--card-hover)] px-3 py-2 text-sm font-medium shadow-2xl"
      style={{ left: drag.x, top: drag.y }}
    >
      {drag.label}
      <span className="block text-xs text-[var(--muted)]">{overLabel ? `Drop in ${overLabel}` : "Drop on a meal"}</span>
    </div>
  );
}
