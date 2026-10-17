"use client";

import { useEffect, useRef, useState } from "react";
import { formatShortDate, parseDate } from "@/lib/dates";

/*
 * Small hand-rolled SVG charts. Specs: 2px lines, <=24px columns with 4px rounded tops,
 * 2px surface ring on dots, 1px solid recessive gridlines, hover tooltip on every chart.
 */

const GRID = "var(--border)";
const AXIS_TEXT = "var(--muted)";

export type Point = { date: string; value: number };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** ~`count` round tick values covering [min, max]. */
function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export function formatNumber(v: number) {
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(0)}K`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function Tooltip({ x, width, children }: { x: number; width: number; children: React.ReactNode }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs shadow-lg"
      style={{ left }}
    >
      {children}
    </div>
  );
}

const M = { top: 28, right: 16, bottom: 24, left: 40 };

/** Pick ~n evenly spaced items (always including the last) for x-axis labels. */
function sampleLabels<T>(items: T[], n: number) {
  if (items.length <= n) return items.map((_, i) => i);
  const step = (items.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.round(i * step));
}

interface LineChartProps {
  points: Point[];
  color?: string;
  unit: string;
  height?: number;
  /** Start the y-axis at zero (otherwise fit to the data). */
  zero?: boolean;
}

/** Time-series line with area wash, end dot + label, and a crosshair tooltip. */
export function LineChart({ points, color = "var(--accent)", unit, height = 200, zero = false }: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return <div ref={ref} className="w-full" />;
  const values = points.map((p) => p.value);
  const lo = zero ? 0 : Math.min(...values);
  const hi = Math.max(...values);
  const pad = zero ? 0 : (hi - lo) * 0.15 || 1;
  const ticks = niceTicks(Math.max(zero ? 0 : lo - pad, 0), hi + pad);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];

  const t0 = parseDate(points[0].date).getTime();
  const t1 = parseDate(points[points.length - 1].date).getTime();
  const innerW = Math.max(width - M.left - M.right - 36, 10);
  const innerH = height - M.top - M.bottom;
  const x = (date: string) => M.left + (t1 === t0 ? innerW / 2 : ((parseDate(date).getTime() - t0) / (t1 - t0)) * innerW);
  const y = (v: number) => M.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.date)},${y(p.value)}`).join("");
  const area = `${line}L${x(points[points.length - 1].date)},${y(yMin)}L${x(points[0].date)},${y(yMin)}Z`;
  const last = points[points.length - 1];
  const hovered = hover != null ? points[hover] : null;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left + M.left;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.date) - px) < Math.abs(x(points[best].date) - px)) best = i;
    });
    setHover(best);
  }

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                {formatNumber(t)}
              </text>
            </g>
          ))}
          {sampleLabels(points, Math.max(2, Math.min(6, Math.floor(innerW / 70)))).map((i) => (
            <text key={i} x={x(points[i].date)} y={height - 6} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
              {formatShortDate(points[i].date)}
            </text>
          ))}
          <path d={area} fill={color} opacity={0.1} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.length <= 31 &&
            points.map((p) => (
              <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={2.5} fill={color} />
            ))}
          <circle cx={x(last.date)} cy={y(last.value)} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
          <text x={x(last.date) + 8} y={y(last.value)} dy="0.32em" fontSize={12} fontWeight={600} fill="var(--foreground)" className="tabular-nums">
            {formatNumber(last.value)}
          </text>
          {hovered && (
            <>
              <line x1={x(hovered.date)} x2={x(hovered.date)} y1={M.top} y2={M.top + innerH} stroke={AXIS_TEXT} strokeWidth={1} />
              <circle cx={x(hovered.date)} cy={y(hovered.value)} r={5} fill={color} stroke="var(--card)" strokeWidth={2} />
            </>
          )}
          <rect
            x={M.left}
            y={0}
            width={innerW}
            height={height}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hovered && (
        <Tooltip x={x(hovered.date)} width={width}>
          <span className="text-[var(--muted)]">{formatShortDate(hovered.date)}</span>{" "}
          <span className="font-semibold tabular-nums">
            {formatNumber(hovered.value)} {unit}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

interface ColumnChartProps {
  bars: { key: string; label: string; value: number | null; tooltip: string }[];
  color?: string;
  goal?: number | null;
  goalLabel?: string;
  height?: number;
}

/** Columns from a zero baseline with an optional goal reference line and per-bar tooltip. */
export function ColumnChart({ bars, color = "var(--accent)", goal, goalLabel, height = 200 }: ColumnChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(goal ?? 0, ...bars.map((b) => b.value ?? 0), 1);
  const ticks = niceTicks(0, max);
  const yMax = ticks[ticks.length - 1];
  const innerW = Math.max(width - M.left - M.right, 10);
  const innerH = height - M.top - M.bottom;
  const slot = innerW / Math.max(bars.length, 1);
  const barW = Math.max(Math.min(24, slot - 2), 1);
  const cx = (i: number) => M.left + slot * i + slot / 2;
  const y = (v: number) => M.top + innerH - (v / yMax) * innerH;
  const r = Math.min(4, barW / 2);

  const hovered = hover != null ? bars[hover] : null;

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={width} height={height} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                {formatNumber(t)}
              </text>
            </g>
          ))}
          {sampleLabels(bars, Math.max(2, Math.min(7, Math.floor(innerW / 60)))).map((i) => (
            <text key={i} x={cx(i)} y={height - 6} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
              {bars[i].label}
            </text>
          ))}
          {bars.map((b, i) => {
            if (b.value == null || b.value <= 0) return null;
            const top = y(b.value);
            const h = M.top + innerH - top;
            const x0 = cx(i) - barW / 2;
            const rr = Math.min(r, h);
            return (
              <path
                key={b.key}
                d={`M${x0},${top + h}V${top + rr}Q${x0},${top} ${x0 + rr},${top}H${x0 + barW - rr}Q${x0 + barW},${top} ${x0 + barW},${top + rr}V${top + h}Z`}
                fill={color}
                opacity={hover == null || hover === i ? 1 : 0.45}
              />
            );
          })}
          {goal != null && goal > 0 && (
            <g>
              <line x1={M.left} x2={M.left + innerW} y1={y(goal)} y2={y(goal)} stroke="var(--foreground)" strokeOpacity={0.6} strokeWidth={1} />
              {/* Key above the plot so the label never sits on the bars. */}
              <line x1={M.left} x2={M.left + 14} y1={10} y2={10} stroke="var(--foreground)" strokeOpacity={0.6} strokeWidth={1} />
              <text x={M.left + 20} y={10} dy="0.32em" fontSize={11} fill={AXIS_TEXT}>
                {goalLabel ?? `Goal ${formatNumber(goal)}`}
              </text>
            </g>
          )}
          {bars.map((b, i) => (
            <rect
              key={b.key}
              x={M.left + slot * i}
              y={M.top}
              width={slot}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            />
          ))}
        </svg>
      )}
      {hovered && hover != null && (
        <Tooltip x={cx(hover)} width={width}>
          {hovered.tooltip}
        </Tooltip>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  delta,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  delta?: { text: string; good: boolean | null } | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-[var(--muted)]">{unit}</span>}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {delta && (
          <span
            className={`mr-1 font-medium ${
              delta.good == null ? "text-[var(--foreground)]" : delta.good ? "text-[var(--accent)]" : "text-red-400"
            }`}
          >
            {delta.text}
          </span>
        )}
        {sub}
      </p>
    </div>
  );
}

/** Average vs goal bar. Fill carries the series color; track is the same hue, faint. */
export function Meter({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const pct = goal > 0 ? value / goal : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="tabular-nums">
          <span className="font-semibold">{Math.round(value)}</span>
          <span className="text-[var(--muted)]">
            {" "}
            / {goal} {unit} · {Math.round(pct * 100)}%
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 1) * 100}%`, background: color }} />
      </div>
    </div>
  );
}
