"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BodyLog } from "@/types/database";
import { AddBodyLogForm } from "./add-body-log-form";

interface BodyWeightHistoryProps {
  logs: BodyLog[];
}

export function BodyWeightHistory({ logs: initialLogs }: BodyWeightHistoryProps) {
  const [logs, setLogs] = useState(initialLogs);

  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <AddBodyLogForm
          onAdded={(log) =>
            setLogs((prev) => [
              log,
              ...prev.filter((l) => l.log_date !== log.log_date),
            ])
          }
        />
        <div className="rounded-xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 p-8 text-center text-sm text-[var(--muted)]">
          No body weight entries yet. Add one above to track progress.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddBodyLogForm
        onAdded={(log) =>
          setLogs((prev) => [
            log,
            ...prev.filter((l) => l.log_date !== log.log_date),
          ])
        }
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--card)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Weight (kg)</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  <td className="px-4 py-2">{log.log_date}</td>
                  <td className="px-4 py-2 font-medium">
                    {log.weight_kg != null ? `${log.weight_kg} kg` : "—"}
                  </td>
                  <td className="px-4 py-2 text-[var(--muted)]">
                    {log.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
