"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import type { TemplateWithExercises, SessionExerciseInput } from "@/app/actions/workout-actions";
import type { ExerciseDefinition } from "@/types/database";

type ConfirmRow = {
  def: ExerciseDefinition;
  weight: string;
  sets: string;
  reps: string;
};

interface StartFromTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateWithExercises;
  definitions: ExerciseDefinition[];
  definitionStats: Record<string, { latestWeight: number | null; maxWeight: number | null }>;
  onStart: (sessionName: string | null, exercises: SessionExerciseInput[]) => void;
}

export function StartFromTemplateModal({
  isOpen,
  onClose,
  template,
  definitions,
  definitionStats,
  onStart,
}: StartFromTemplateModalProps) {
  const [sessionName, setSessionName] = useState(template.name);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [confirmRows, setConfirmRows] = useState<ConfirmRow[]>([]);

  const templateDefIds = useMemo(
    () =>
      template.workout_template_exercises
        .map((te) => te.exercise_definition_id)
        .filter(Boolean),
    [template]
  );
  const templateDefs = useMemo(
    () =>
      template.workout_template_exercises
        .map((te) => te.exercise_definitions)
        .filter((d): d is ExerciseDefinition => d != null),
    [template]
  );
  const libraryDefs = useMemo(
    () => definitions.filter((d) => !templateDefIds.includes(d.id)),
    [definitions, templateDefIds]
  );
  const selectedDefs = useMemo(
    () =>
      [...templateDefs, ...libraryDefs].filter((d) => selectedIds.has(d.id)),
    [templateDefs, libraryDefs, selectedIds]
  );

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLibrary = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToConfirm = () => {
    const rows: ConfirmRow[] = selectedDefs.map((def) => {
      const stats = definitionStats[def.id];
      const latest = stats?.latestWeight;
      return {
        def,
        weight: latest != null ? String(latest) : "",
        sets: "0",
        reps: "",
      };
    });
    setConfirmRows(rows);
    setStep("confirm");
  };

  const setConfirmRow = (index: number, field: keyof Omit<ConfirmRow, "def">, value: string) => {
    setConfirmRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleConfirm = () => {
    const exercises: SessionExerciseInput[] = confirmRows.map((r) => {
      const w = r.weight.trim() === "" ? null : parseFloat(r.weight);
      const repsVal = r.reps.trim() === "" ? null : parseInt(r.reps, 10);
      return {
        exercise_definition_id: r.def.id,
        name: r.def.name,
        weight_kg: w != null && !Number.isNaN(w) ? w : null,
        sets: r.sets === "" ? 0 : parseInt(r.sets, 10) || 0,
        reps: repsVal != null && !Number.isNaN(repsVal) ? repsVal : null,
      };
    });
    onStart(sessionName.trim() || null, exercises);
    setSessionName(template.name);
    setSelectedIds(new Set());
    setLibraryOpen(false);
    setStep("select");
    setConfirmRows([]);
    onClose();
  };

  const backToSelect = () => {
    setStep("select");
    setConfirmRows([]);
  };

  if (step === "confirm") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Confirm weights"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Set weight (kg) and optionally sets/reps for each exercise, then add to log.
          </p>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {confirmRows.map((row, i) => (
              <div
                key={row.def.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
              >
                <p className="mb-2 text-sm font-medium text-[var(--foreground)]">
                  {row.def.name}
                  {row.def.muscle_group && (
                    <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                      {row.def.muscle_group}
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-0.5 block text-xs text-[var(--muted)]">Weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={row.weight}
                      onChange={(e) => setConfirmRow(i, "weight", e.target.value)}
                      placeholder="—"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-[var(--muted)]">Sets</label>
                    <input
                      type="number"
                      min={0}
                      value={row.sets}
                      onChange={(e) => setConfirmRow(i, "sets", e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-[var(--muted)]">Reps</label>
                    <input
                      type="number"
                      min={0}
                      value={row.reps}
                      onChange={(e) => setConfirmRow(i, "reps", e.target.value)}
                      placeholder="—"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={backToSelect}
              className="flex-1 rounded-xl border border-[var(--border)] py-2.5 font-medium transition-colors hover:bg-[var(--card-hover)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Confirm and add to log
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Start: ${template.name}`}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
            Session name
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder={template.name}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            Select exercises you did today
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
            {templateDefs.map((def) => (
              <label
                key={def.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--card)]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(def.id)}
                  onChange={() => toggleTemplate(def.id)}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {def.name}
                </span>
                {def.muscle_group && (
                  <span className="text-xs text-[var(--muted)]">
                    {def.muscle_group}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {libraryDefs.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setLibraryOpen(!libraryOpen)}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {libraryOpen ? "Hide" : "Add from library"} ({libraryDefs.length})
            </button>
            {libraryOpen && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
                {libraryDefs.map((def) => (
                  <label
                    key={def.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--card)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(def.id)}
                      onChange={() => toggleLibrary(def.id)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">
                      {def.name}
                    </span>
                    {def.muscle_group && (
                      <span className="text-xs text-[var(--muted)]">
                        {def.muscle_group}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--border)] py-2.5 font-medium transition-colors hover:bg-[var(--card-hover)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={goToConfirm}
            disabled={selectedIds.size === 0}
            className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Start session ({selectedIds.size})
          </button>
        </div>
      </div>
    </Modal>
  );
}
