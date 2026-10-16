"use client";

import { Modal } from "@/components/ui/modal";
import type { ExerciseDefinition } from "@/types/database";
import type { MaxLog } from "@/app/actions/workout-actions";
import { iconForExercise } from "@/lib/exercise-library";
import { ExerciseIcon } from "./exercise-icon";
import { formatKg } from "./exercise-card";

interface ExerciseHistoryModalProps {
  definition: ExerciseDefinition | null;
  history: MaxLog[];
  onClose: () => void;
  onDeleteLog: (date: string) => void;
  onRemove: () => void;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ExerciseHistoryModal({
  definition,
  history,
  onClose,
  onDeleteLog,
  onRemove,
}: ExerciseHistoryModalProps) {
  if (!definition) return null;
  const best = history.length ? Math.max(...history.map((h) => h.kg)) : null;
  const rows = [...history].reverse();

  return (
    <Modal isOpen onClose={onClose} title={definition.name}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ExerciseIcon icon={iconForExercise(definition.name, definition.muscle_group)} className="h-16 w-16" />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            <div className="rounded-xl bg-[var(--background)] p-3">
              <p className="text-xs text-[var(--muted)]">Best</p>
              <p className="text-lg font-semibold tabular-nums">{best != null ? formatKg(best) : "—"}</p>
            </div>
            <div className="rounded-xl bg-[var(--background)] p-3">
              <p className="text-xs text-[var(--muted)]">Days logged</p>
              <p className="text-lg font-semibold tabular-nums">{history.length}</p>
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">No logs yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {rows.map((h) => (
              <li key={h.date} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-[var(--muted)]">{formatDate(h.date)}</span>
                <span className="flex items-center gap-3">
                  <span className={`font-semibold tabular-nums ${h.kg === best ? "text-[var(--accent)]" : ""}`}>
                    {formatKg(h.kg)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteLog(h.date)}
                    className="text-[var(--muted)] transition-colors hover:text-red-400"
                    aria-label={`Delete log for ${h.date}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove ${definition.name} from your exercises?`)) onRemove();
          }}
          className="w-full rounded-xl border border-[var(--border)] py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          Remove exercise
        </button>
      </div>
    </Modal>
  );
}
