"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { ExerciseDefinition } from "@/types/database";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  definitions: ExerciseDefinition[];
  onCreate: (name: string, exerciseDefinitionIds: string[]) => void;
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  definitions,
  onCreate,
}: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim() || selectedIds.size === 0) return;
    onCreate(name.trim(), Array.from(selectedIds));
    setName("");
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New template">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
            Template name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push, Pull, Legs"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            Add exercises to the pool
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
            {definitions.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-[var(--muted)]">
                No exercises in library. Add exercises when creating a manual session first.
              </p>
            ) : (
              definitions.map((def) => (
                <label
                  key={def.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--card)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(def.id)}
                    onChange={() => toggle(def.id)}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{def.name}</span>
                  {def.muscle_group && (
                    <span className="text-xs text-[var(--muted)]">{def.muscle_group}</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
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
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.size === 0}
            className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Create ({selectedIds.size})
          </button>
        </div>
      </div>
    </Modal>
  );
}
