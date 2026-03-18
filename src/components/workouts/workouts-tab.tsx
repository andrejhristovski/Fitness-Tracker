"use client";

import { useState } from "react";
import type { WorkoutSession, ExerciseEntry, ExerciseDefinition } from "@/types/database";
import type { SessionWithEntries, TemplateWithExercises, SessionExerciseInput } from "@/app/actions/workout-actions";
import {
  createSessionWithExercises,
  createExerciseDefinition,
  createWorkoutTemplate,
} from "@/app/actions/workout-actions";
import { StartFromTemplateModal } from "./start-from-template-modal";
import { ManualSessionModal } from "./manual-session-modal";
import { CreateTemplateModal } from "./create-template-modal";
import { SessionCard } from "./session-card";

interface WorkoutsTabProps {
  initialSessions: SessionWithEntries[];
  templates: TemplateWithExercises[];
  definitions: ExerciseDefinition[];
  definitionStats: Record<string, { latestWeight: number | null; maxWeight: number | null }>;
}

export function WorkoutsTab({
  initialSessions,
  templates: initialTemplates,
  definitions: initialDefinitions,
  definitionStats,
}: WorkoutsTabProps) {
  const [sessions, setSessions] = useState<SessionWithEntries[]>(initialSessions);
  const [templates, setTemplates] = useState<TemplateWithExercises[]>(initialTemplates);
  const [definitions, setDefinitions] = useState<ExerciseDefinition[]>(initialDefinitions);
  const [templateModal, setTemplateModal] = useState<TemplateWithExercises | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);

  async function handleStartFromTemplate(
    sessionName: string | null,
    exercises: SessionExerciseInput[]
  ) {
    if (!templateModal) return;
    const today = new Date().toISOString().slice(0, 10);
    const result = await createSessionWithExercises(today, sessionName, exercises);
    if (result.ok) {
      setSessions((prev) => [result.session, ...prev]);
      setTemplateModal(null);
    }
  }

  async function handleStartManual(
    sessionName: string,
    sessionDate: string,
    exercises: SessionExerciseInput[]
  ) {
    const result = await createSessionWithExercises(sessionDate, sessionName, exercises);
    if (result.ok) {
      setSessions((prev) => [result.session, ...prev]);
      setManualModalOpen(false);
    }
  }

  async function handleCreateDefinition(
    name: string,
    muscleGroup: string | null
  ): Promise<ExerciseDefinition | null> {
    const result = await createExerciseDefinition(name, muscleGroup);
    if (!result.ok) return null;
    setDefinitions((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)));
    return result.data;
  }

  async function handleCreateTemplate(name: string, exerciseDefinitionIds: string[]) {
    const result = await createWorkoutTemplate(name, exerciseDefinitionIds);
    if (result.ok) setTemplates((prev) => [...prev, result.template].sort((a, b) => a.name.localeCompare(b.name)));
    setCreateTemplateOpen(false);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.session_date === todayStr);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Workouts
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Start from a template or add a manual session.
        </p>
      </div>

      {/* Primary action: Add manual session */}
      <section>
        <button
          type="button"
          onClick={() => setManualModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-4 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
        >
          <span className="text-xl leading-none">+</span>
          Add manual session
        </button>
      </section>

      {/* Favorite templates */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Favorites
          </h2>
          <button
            type="button"
            onClick={() => setCreateTemplateOpen(true)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--card-hover)]"
          >
            New template
          </button>
        </div>
        {templates.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 px-4 py-6 text-center text-sm text-[var(--muted)]">
            No templates yet. Add a manual session first, then create a template from the library.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setTemplateModal(template)}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-sm transition-all hover:border-[var(--accent)]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <h3 className="font-semibold text-[var(--foreground)]">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {template.workout_template_exercises.length} exercise
                  {template.workout_template_exercises.length !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Today's sessions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Today&apos;s sessions
        </h2>
        {todaySessions.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 p-8 text-center text-sm text-[var(--muted)]">
            No sessions today. Add a manual session or start from a favorite above.
          </div>
        ) : (
          <div className="space-y-4">
            {todaySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                definitions={definitions}
                definitionStats={definitionStats}
                onUpdated={(updated) =>
                  setSessions((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                  )
                }
                onDeleted={(id) =>
                  setSessions((prev) => prev.filter((s) => s.id !== id))
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {templateModal && (
        <StartFromTemplateModal
          isOpen={!!templateModal}
          onClose={() => setTemplateModal(null)}
          template={templateModal}
          definitions={definitions}
          definitionStats={definitionStats}
          onStart={handleStartFromTemplate}
        />
      )}
      <ManualSessionModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        definitions={definitions}
        definitionStats={definitionStats}
        onCreateDefinition={handleCreateDefinition}
        onStart={handleStartManual}
      />
      <CreateTemplateModal
        isOpen={createTemplateOpen}
        onClose={() => setCreateTemplateOpen(false)}
        definitions={definitions}
        onCreate={handleCreateTemplate}
      />
    </div>
  );
}
