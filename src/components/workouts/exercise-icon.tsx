import type { ExerciseIconKey } from "@/lib/exercise-library";

/** Minimal line-art figures for each movement pattern (64x64, stroke = currentColor). */
const PATHS: Record<ExerciseIconKey, React.ReactNode> = {
  bench: (
    <>
      <path d="M10 44h40M16 44v10M44 44v10" />
      <circle cx="13" cy="36" r="4" />
      <path d="M18 38h20l8-6 4 20M24 38V22M12 22h24M15 17v10M33 17v10" />
    </>
  ),
  squat: (
    <>
      <path d="M10 20h44M14 15v10M50 15v10" />
      <circle cx="32" cy="13" r="4" />
      <path d="M20 20v8l6-4h12l6 4v-8M32 24v14l-12 6 4 12M32 38l12 6-4 12" />
    </>
  ),
  deadlift: (
    <>
      <circle cx="44" cy="19" r="4" />
      <path d="M39 24L22 30l6 12-4 14h6M37 25l-3 18" />
      <circle cx="33" cy="47" r="8" />
      <path d="M8 56h48" />
    </>
  ),
  press: (
    <>
      <path d="M10 8h44M14 3v10M50 3v10" />
      <circle cx="32" cy="18" r="4" />
      <path d="M20 8l4 12 8 3 8-3 4-12M32 23v17l-6 16M32 40l6 16" />
    </>
  ),
  row: (
    <>
      <circle cx="46" cy="21" r="4" />
      <path d="M41 26L20 32l4 12-4 12h6M39 27l-8 8 6 5" />
      <circle cx="37" cy="44" r="6" />
    </>
  ),
  pullup: (
    <>
      <path d="M8 8h48" />
      <path d="M22 8l-4 10 8 6h12l8-6-4-10" />
      <circle cx="32" cy="17" r="4" />
      <path d="M32 24v18l-4 16M32 42l4 16" />
    </>
  ),
  pulldown: (
    <>
      <path d="M32 4v8M16 12h32" />
      <path d="M18 12l2 14 6 4h12l6-4 2-14" />
      <circle cx="32" cy="23" r="4" />
      <path d="M32 30v14M20 46h24M26 46v10M38 46v10" />
    </>
  ),
  curl: (
    <>
      <circle cx="30" cy="12" r="4" />
      <path d="M30 17v21l-4 18M30 38l4 18M30 20l2 12 10-8" />
      <path d="M42 18v12M39 18h6M39 30h6" />
    </>
  ),
  pushdown: (
    <>
      <circle cx="46" cy="6" r="2.5" />
      <path d="M46 9l-6 31" />
      <circle cx="26" cy="12" r="4" />
      <path d="M26 17v21l-4 18M26 38l4 18M26 20l4 12 10 8" />
    </>
  ),
  raise: (
    <>
      <circle cx="32" cy="14" r="4" />
      <path d="M32 19v21l-6 16M32 40l6 16M14 24l18-2 18 2" />
      <path d="M12 19v10M52 19v10" />
    </>
  ),
  fly: (
    <>
      <circle cx="8" cy="6" r="2.5" />
      <circle cx="56" cy="6" r="2.5" />
      <path d="M10 8l12 26M54 8L42 34" />
      <circle cx="32" cy="16" r="4" />
      <path d="M32 21v21l-6 14M32 42l6 14M32 24l-14 2 4 8M32 24l14 2-4 8" />
    </>
  ),
  shrug: (
    <>
      <circle cx="32" cy="16" r="4" />
      <path d="M32 21v19l-6 16M32 40l6 16M24 22l8 2 8-2M24 22l-2 16M40 22l2 16" />
      <path d="M22 34v10M42 34v10M12 22v-10M9 15l3-3 3 3M52 22v-10M49 15l3-3 3 3" />
    </>
  ),
  lunge: (
    <>
      <circle cx="30" cy="10" r="4" />
      <path d="M30 15v19l12 6v14M30 34l-8 18H12M30 18l4 12" />
    </>
  ),
  machine: (
    <>
      <path d="M16 16l2 26h24M28 42v14M20 56h16" />
      <circle cx="22" cy="14" r="4" />
      <path d="M22 19l2 19h16l8-8" />
      <circle cx="50" cy="28" r="3" />
    </>
  ),
  calf: (
    <>
      <circle cx="30" cy="10" r="4" />
      <path d="M30 15v21l-1 13 7 4M30 36l1 13M30 18v14" />
      <path d="M18 53h30M18 53v5M48 34V22M45 25l3-3 3 3" />
    </>
  ),
  dip: (
    <>
      <path d="M20 30v28M44 30v28M16 30h8M40 30h8" />
      <circle cx="32" cy="14" r="4" />
      <path d="M27 22l-7 8M37 22l7 8M26 21h12M32 21v19l-2 12M32 40l2 12" />
    </>
  ),
  hipthrust: (
    <>
      <path d="M4 32h14M11 32v22M4 54h56" />
      <circle cx="9" cy="24" r="4" />
      <path d="M14 28l20-2 10 4v22" />
      <circle cx="34" cy="19" r="6" />
    </>
  ),
  plank: (
    <>
      <circle cx="12" cy="30" r="4" />
      <path d="M18 34l34 16M18 34v18h8M6 54h52" />
    </>
  ),
  pushup: (
    <>
      <circle cx="12" cy="30" r="4" />
      <path d="M18 34l34 16M18 34l-2 18M6 54h52" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M20 32h24M12 24v16M18 20v24M46 20v24M52 24v16" />
    </>
  ),
};

export function ExerciseIcon({
  icon,
  className = "h-12 w-12",
}: {
  icon: ExerciseIconKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[icon]}
    </svg>
  );
}
