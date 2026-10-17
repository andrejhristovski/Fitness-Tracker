"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { ExerciseDefinition } from "@/types/database";
import type { DayPlan } from "@/app/actions/workout-actions";
import { iconForExercise } from "@/lib/exercise-library";
import { ExerciseIcon } from "./exercise-icon";

interface DayPlanModalProps {
  /** The day being edited, or null to create a new one. */
  plan: DayPlan | null;
  isOpen: boolean;
  definitions: ExerciseDefinition[];
  onClose: () => void;
  onSave: (name: string, exerciseIds: string[]) => Promise<boolean>;
  onDelete?: () => void;
}

export function DayPlanModal({ plan, isOpen, definitions, onClose, onSave, onDelete }: DayPlanModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plan ? "Edit day" : "New workout day"}>
      {/* Remount per plan so the form starts from that plan's values. */}
      <DayPlanForm
        key={plan?.id ?? "new"}
        plan={plan}
        definitions={definitions}
        onSave={onSave}
        onDelete={onDelete}
      />
    </Modal>
  );
}

function DayPlanForm({
  plan,
  definitions,
  onSave,
  onDelete,
}: Pick<DayPlanModalProps, "plan" | "definitions" | "onSave" | "onDelete">) {
  const [name, setName] = useState(plan?.name ?? "");
  const [ids, setIds] = useState<string[]>(plan?.exerciseIds ?? []);
  const [saving, setSaving] = useState(false);

  const byId = new Map(definitions.map((d) => [d.id, d]));
  const inDay = ids.map((id) => byId.get(id)).filter((d): d is ExerciseDefinition => !!d);
  const others = definitions.filter((d) => !ids.includes(d.id));

  function move(index: number, dir: -1 | 1) {
    setIds((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await onSave(name, ids);
    setSaving(false);
  }

  const rowIcon = (d: ExerciseDefinition) => (
    <ExerciseIcon icon={iconForExercise(d.name, d.muscle_group)} className="h-7 w-7 shrink-0 text-[var(--accent)]" />
  );

  return (
    <div className="space-y-4">
      <input
        autoFocus={!plan}
        placeholder="Day name, e.g. Chest & Triceps"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 outline-none focus:border-[var(--accent)]"
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          In this day ({inDay.length})
        </p>
        {inDay.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
            Tap exercises below to add them.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {inDay.map((d, i) => (
              <li
                key={d.id}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2"
              >
                {rowIcon(d)}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.name}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30" aria-label="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === inDay.length - 1} className="px-1 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30" aria-label="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => setIds((prev) => prev.filter((x) => x !== d.id))} className="px-1 text-[var(--muted)] hover:text-red-400" aria-label={`Remove ${d.name} from day`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Your other exercises
          </p>
          <div className="flex flex-wrap gap-2">
            {others.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setIds((prev) => [...prev, d.id])}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border)] py-1 pl-2 pr-3 text-xs transition-colors hover:border-[var(--accent)]/50"
              >
                <span className="text-[var(--accent)]">+</span> {d.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Need something new? Save the day, then use “Add exercise” to pick from the library.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {plan && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${plan.name}"? Your exercises and history are kept.`)) onDelete();
            }}
            className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          disabled={!name.trim() || saving}
          onClick={save}
          className="flex-1 rounded-xl bg-[var(--accent)] py-3 font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          {saving ? "Saving…" : plan ? "Save" : "Create day"}
        </button>
      </div>
    </div>
  );
}
