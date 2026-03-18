"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutSession, ExerciseEntry } from "@/types/database";
import type { ExerciseDefinition } from "@/types/database";
import { ExerciseEntryCard } from "./exercise-entry-card";
import { addExerciseToSession } from "@/app/actions/workout-actions";

type SessionWithExercises = WorkoutSession & { exercise_entries: ExerciseEntry[] };

interface SessionCardProps {
  session: SessionWithExercises;
  definitions: ExerciseDefinition[];
  definitionStats: Record<string, { latestWeight: number | null; maxWeight: number | null }>;
  onUpdated: (session: SessionWithExercises) => void;
  onDeleted: (id: string) => void;
}

export function SessionCard({
  session,
  definitions,
  definitionStats,
  onUpdated,
  onDeleted,
}: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  async function handleDeleteSession() {
    if (!confirm("Delete this workout session?")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("workout_sessions").delete().eq("id", session.id);
    onDeleted(session.id);
    setDeleting(false);
  }

  async function handleAddExercise(def: ExerciseDefinition) {
    const result = await addExerciseToSession(session.id, def.id, def.name);
    if (result.ok) {
      onUpdated({
        ...session,
        exercise_entries: [...session.exercise_entries, result.data].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      });
      setShowAddExercise(false);
    }
  }

  function handleEntryUpdated(updated: ExerciseEntry) {
    onUpdated({
      ...session,
      exercise_entries: session.exercise_entries.map((e) =>
        e.id === updated.id ? updated : e
      ),
    });
  }

  function handleEntryDeleted(id: string) {
    onUpdated({
      ...session,
      exercise_entries: session.exercise_entries.filter((e) => e.id !== id),
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--card-hover)]"
      >
        <div>
          <p className="font-semibold text-[var(--foreground)]">
            {session.name || "Workout"} · {session.session_date}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {session.exercise_entries.length} exercise(s)
          </p>
        </div>
        <span className="text-[var(--muted)]">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
          {session.notes && (
            <p className="mb-3 text-sm text-[var(--muted)]">{session.notes}</p>
          )}
          <div className="space-y-3">
            {session.exercise_entries.map((ex) => {
              const stats = ex.exercise_definition_id
                ? definitionStats[ex.exercise_definition_id]
                : undefined;
              return (
                <ExerciseEntryCard
                  key={ex.id}
                  entry={ex}
                  latestWeight={stats?.latestWeight ?? null}
                  maxWeight={stats?.maxWeight ?? null}
                  onUpdated={handleEntryUpdated}
                  onDeleted={handleEntryDeleted}
                />
              );
            })}
          </div>
          <div className="mt-3">
            {!showAddExercise ? (
              <button
                type="button"
                onClick={() => setShowAddExercise(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--card)]"
              >
                <span className="text-lg leading-none">+</span>
                Add exercise
              </button>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="mb-2 text-xs font-medium text-[var(--muted)]">
                  Choose from library
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {definitions.map((def) => (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => handleAddExercise(def)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card)]"
                    >
                      {def.name}
                      {def.muscle_group && (
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          {def.muscle_group}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExercise(false)}
                  className="mt-2 text-xs text-[var(--muted)] hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDeleteSession}
            disabled={deleting}
            className="mt-4 text-sm text-red-400 hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete session"}
          </button>
        </div>
      )}
    </div>
  );
}
