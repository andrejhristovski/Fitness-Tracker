"use client";

import type { BodyLog } from "@/types/database";
import { BodyWeightHistory } from "./body-weight-history";
import { WorkoutProgress } from "./workout-progress";
import { NutritionSummary } from "./nutrition-summary";

interface FoodEntryRow {
  log_date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
}

interface SessionRow {
  id: string;
  session_date: string;
  name: string | null;
}

interface StatsTabProps {
  bodyLogs: BodyLog[];
  foodEntries: FoodEntryRow[];
  sessions: SessionRow[];
  currentWeightKg: number | null;
}

export function StatsTab({
  bodyLogs,
  foodEntries,
  sessions,
  currentWeightKg,
}: StatsTabProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Stats & trends</h2>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--muted)]">
            Body weight history
          </h3>
          {currentWeightKg != null && (
            <span className="text-sm font-medium text-[var(--foreground)]">
              Current: {currentWeightKg} kg
            </span>
          )}
        </div>
        <BodyWeightHistory logs={bodyLogs} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">
          Workout progress
        </h3>
        <WorkoutProgress sessions={sessions} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">
          Nutrition summary
        </h3>
        <NutritionSummary entries={foodEntries} />
      </section>
    </div>
  );
}
