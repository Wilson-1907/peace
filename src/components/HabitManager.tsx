"use client";

import { useMemo, useState } from "react";
import { Archive, GripVertical, Plus, X } from "lucide-react";
import type { AssignedTo, Habit } from "@/lib/types";

interface HabitManagerProps {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
  currentUserId: string;
  onCreate: (name: string, assigned_to: AssignedTo) => Promise<void>;
  onArchive: (habitId: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}

export function HabitManager({
  open,
  onClose,
  habits,
  currentUserId,
  onCreate,
  onArchive,
  onReorder,
}: HabitManagerProps) {
  const [name, setName] = useState("");
  const [assignedTo, setAssignedTo] = useState<AssignedTo>("me");
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const mine = useMemo(
    () =>
      habits
        .filter((h) => h.user_id === currentUserId && h.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [habits, currentUserId]
  );

  const archived = useMemo(
    () =>
      habits.filter((h) => h.user_id === currentUserId && !h.is_active),
    [habits, currentUserId]
  );

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), assignedTo);
      setName("");
      setAssignedTo("me");
    } finally {
      setSaving(false);
    }
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = mine.map((h) => h.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);
    await onReorder(ids);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-blue-50 px-4 py-3">
          <h3 className="font-display text-lg font-semibold text-blue-950">
            Manage habits
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          <form onSubmit={handleCreate} className="space-y-3 rounded-xl bg-blue-50/60 p-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                New habit
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sleep by 11:00 PM"
                className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Assign to
              </legend>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    ["me", "Me"],
                    ["partner", "Partner"],
                    ["both", "Both"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-sm font-medium transition ${
                      assignedTo === value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-blue-200 bg-white text-blue-800 hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="assigned_to"
                      value={value}
                      checked={assignedTo === value}
                      onChange={() => setAssignedTo(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add habit
            </button>
          </form>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-500">
              Active ({mine.length})
            </p>
            <ul className="space-y-1.5">
              {mine.map((habit) => (
                <li
                  key={habit.id}
                  draggable
                  onDragStart={() => setDragId(habit.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => void handleDrop(habit.id)}
                  className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-2 py-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {habit.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-blue-400">
                      {habit.assigned_to}
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Archive (keeps history)"
                    onClick={() => void onArchive(habit.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {mine.length === 0 && (
                <li className="py-4 text-center text-sm text-slate-400">
                  No active habits yet.
                </li>
              )}
            </ul>
          </div>

          {archived.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Archived ({archived.length}) — history preserved
              </p>
              <ul className="space-y-1">
                {archived.map((habit) => (
                  <li
                    key={habit.id}
                    className="rounded-lg px-2 py-1.5 text-sm text-slate-400 line-through"
                  >
                    {habit.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
