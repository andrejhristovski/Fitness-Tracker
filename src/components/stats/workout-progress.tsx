"use client";

interface SessionRow {
  id: string;
  session_date: string;
  name: string | null;
}

interface WorkoutProgressProps {
  sessions: SessionRow[];
}

export function WorkoutProgress({ sessions }: WorkoutProgressProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 p-8 text-center text-sm text-[var(--muted)]">
        No workouts yet. Log sessions in the Workouts tab.
      </div>
    );
  }

  const byWeek = sessions.reduce<Record<string, number>>((acc, s) => {
    const d = new Date(s.session_date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const weekEntries = Object.entries(byWeek)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--card)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Week starting</th>
                <th className="px-4 py-2 font-medium">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {weekEntries.map(([week, count]) => (
                <tr
                  key={week}
                  className="border-t border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  <td className="px-4 py-2">{week}</td>
                  <td className="px-4 py-2 font-medium">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Last {sessions.length} sessions · grouped by week
      </p>
    </div>
  );
}
