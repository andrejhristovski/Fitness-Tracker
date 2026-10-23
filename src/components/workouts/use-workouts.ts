"use client";

import { useMemo, useState } from "react";
import type { ExerciseDefinition } from "@/types/database";
import {
  addExercises,
  createDayPlans,
  deleteDayPlan,
  deleteExerciseDefinition,
  logDailyMax,
  updateDayPlan,
  type DayPlan,
  type MaxLog,
} from "@/app/actions/workout-actions";
import { localDate } from "@/lib/dates";
import { suggestDay } from "@/lib/workout-plan";
import { MUSCLE_GROUPS, PRESET_DAYS, findLibraryExercise } from "@/lib/exercise-library";

export const ALL = "all";

export interface WorkoutsData {
  initialDefinitions: ExerciseDefinition[];
  initialHistory: Record<string, MaxLog[]>;
  initialPlans: DayPlan[];
}

function withLog(history: MaxLog[], date: string, kg: number | null): MaxLog[] {
  const rest = history.filter((h) => h.date !== date);
  return kg == null ? rest : [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
}

export function daysAgo(date: string, today: string) {
  const diff = Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff} days ago`;
}

/** All Workouts state and actions (shared by every Workouts layout). */
export function useWorkouts({ initialDefinitions, initialHistory, initialPlans }: WorkoutsData) {
  const [today] = useState(localDate);
  const [definitions, setDefinitions] = useState(initialDefinitions);
  const [history, setHistory] = useState(initialHistory);
  const [plans, setPlans] = useState(initialPlans);
  const [suggested] = useState(() => suggestDay(initialPlans, initialHistory, today));
  const [selected, setSelected] = useState<string>(suggested ?? ALL);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [dayModal, setDayModal] = useState<"new" | "edit" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === selected) ?? null;
  const byId = useMemo(() => new Map(definitions.map((d) => [d.id, d])), [definitions]);

  const groups = useMemo(() => {
    const present = new Set(definitions.map((d) => d.muscle_group ?? "Other"));
    return [...MUSCLE_GROUPS, "Other"].filter((g) => present.has(g));
  }, [definitions]);

  const visible = plan
    ? plan.exerciseIds.map((id) => byId.get(id)).filter((d): d is ExerciseDefinition => !!d)
    : definitions.filter((d) => !muscle || (d.muscle_group ?? "Other") === muscle);
  const loggedToday = visible.filter((d) => history[d.id]?.some((h) => h.date === today)).length;
  const openDefinition = definitions.find((d) => d.id === openId) ?? null;

  /** Optimistic: the new weight shows immediately; it's rolled back if saving fails. */
  async function saveLog(definition: ExerciseDefinition, date: string, kg: number | null) {
    const before = history[definition.id] ?? [];
    setHistory((prev) => ({ ...prev, [definition.id]: withLog(prev[definition.id] ?? [], date, kg) }));
    const result = await logDailyMax({ id: definition.id, name: definition.name }, date, kg);
    if (!result.ok) {
      setHistory((prev) => ({ ...prev, [definition.id]: before }));
      setError(result.error);
    }
    return result.ok;
  }

  async function handleAdd(items: { name: string; muscle_group: string | null }[]) {
    const result = await addExercises(items, plan?.id ?? null);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setDefinitions((prev) => [...prev, ...result.created]);
    if (plan && result.planExerciseIds) {
      const ids = result.planExerciseIds;
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, exerciseIds: ids } : p)));
    }
    return true;
  }

  async function handleRemove(id: string) {
    const result = await deleteExerciseDefinition(id);
    if (!result.ok) setError(result.error);
    if (result.ok) {
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      setPlans((prev) => prev.map((p) => ({ ...p, exerciseIds: p.exerciseIds.filter((x) => x !== id) })));
      setOpenId(null);
    }
  }

  async function createPresets(presets: typeof PRESET_DAYS) {
    setBusy(true);
    try {
      const result = await createDayPlans(
        presets.map((p) => ({
          name: p.name,
          items: p.exercises.map((name) => ({ name, muscle_group: findLibraryExercise(name)?.muscle ?? null })),
        }))
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDefinitions((prev) => [...prev, ...result.created]);
      setPlans((prev) => [...prev, ...result.plans]);
      setSelected((cur) => (cur === ALL && result.plans[0] ? result.plans[0].id : cur));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDay(name: string, exerciseIds: string[]) {
    if (dayModal === "edit" && plan) {
      const result = await updateDayPlan(plan.id, name, exerciseIds);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, name: name.trim(), exerciseIds } : p)));
    } else {
      const items = exerciseIds
        .map((id) => byId.get(id))
        .filter((d): d is ExerciseDefinition => !!d)
        .map((d) => ({ name: d.name, muscle_group: d.muscle_group }));
      const result = await createDayPlans([{ name, items }]);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setPlans((prev) => [...prev, ...result.plans]);
      setSelected(result.plans[0].id);
    }
    setDayModal(null);
    return true;
  }

  async function handleDeleteDay() {
    if (!plan) return;
    const result = await deleteDayPlan(plan.id);
    if (!result.ok) setError(result.error);
    if (result.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      setSelected(ALL);
      setDayModal(null);
    }
  }

  const missingPresets = PRESET_DAYS.filter((p) => !plans.some((pl) => pl.name.toLowerCase() === p.name.toLowerCase()));
  const disabledNames = new Set((plan ? visible : definitions).map((d) => d.name.toLowerCase()));

  return {
    today,
    definitions,
    history,
    plans,
    suggested,
    selected,
    setSelected,
    muscle,
    setMuscle,
    libraryOpen,
    setLibraryOpen,
    dayModal,
    setDayModal,
    openId,
    setOpenId,
    busy,
    error,
    setError,
    plan,
    groups,
    visible,
    loggedToday,
    openDefinition,
    missingPresets,
    disabledNames,
    saveLog,
    handleAdd,
    handleRemove,
    createPresets,
    handleSaveDay,
    handleDeleteDay,
  };
}
