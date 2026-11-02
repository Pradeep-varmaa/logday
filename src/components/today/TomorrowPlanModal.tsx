'use client';

import React, { useState, useEffect } from 'react';
import { TodoItem } from '@/types/activity';
import { queueLogUpsert } from '@/lib/storage/sync';
import { playCheckPop, playCompleteFanfare } from '@/lib/audio/sound';
import { useAppStore } from '@/store/useAppStore';
import { CalendarCheck, Check, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TomorrowPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string; // YYYY-MM-DD
  activityId?: string;
  onSaved?: () => void;
}

export const TomorrowPlanModal: React.FC<TomorrowPlanModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  activityId,
  onSaved,
}) => {
  const triggerConfetti = useAppStore((state) => state.triggerConfetti);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Compute tomorrow's date string
  const tomorrowStr = React.useMemo(() => {
    try {
      const parts = currentDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    } catch {
      return currentDate;
    }
  }, [currentDate]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch('/api/todos?incomplete=true');
        if (res.ok) {
          const list = await res.json();
          setTodos(list);
        }

        // Check if there is already a plan for tomorrow
        const planRes = await fetch(`/api/tomorrow-plan?date=${tomorrowStr}`);
        if (planRes.ok) {
          const json = await planRes.json();
          if (json.plan) {
            setSelectedTasks(json.plan.tasks || []);
            setNote(json.plan.note || '');
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, tomorrowStr]);

  if (!isOpen) return null;

  const toggleSelectTask = (taskTitle: string) => {
    playCheckPop();
    setSelectedTasks((prev) =>
      prev.includes(taskTitle) ? prev.filter((t) => t !== taskTitle) : [...prev, taskTitle]
    );
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Save tomorrow plan
      await fetch('/api/tomorrow-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          tasks: selectedTasks,
          note: note.trim() || null,
        }),
      });

      // 2. If triggered by habit "Plan tomorrow", complete it
      if (activityId) {
        await queueLogUpsert(
          activityId,
          currentDate,
          1,
          selectedTasks.length > 0 ? `Focus: ${selectedTasks.join(', ')}` : 'Planned tomorrow'
        );
      }

      playCompleteFanfare();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#22d3ee', '#1d4ed8', '#6366f1'],
        });
      } catch (_) {}

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to save tomorrow plan:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-cyan-500/30 shadow-glass relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Plan Tomorrow</h3>
            <p className="text-xs text-slate-400">Prime your morning focus for {tomorrowStr}</p>
          </div>
        </div>

        <form onSubmit={handleSavePlan} className="space-y-4">
          {/* Main Focus / Intention Note */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tomorrow&apos;s Core Intention
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Wake up early, crush morning workout, deep work block"
              className="w-full bg-navy-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          {/* Select Top 3 Priority Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Select Priority Tasks ({selectedTasks.length})
              </label>
              <span className="text-[10px] text-cyan-400 font-medium">From your To-Do list</span>
            </div>

            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mx-auto" />
              </div>
            ) : todos.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-navy-950/40 border border-white/5 text-center text-xs text-slate-400">
                No open to-dos. You can write your intention above!
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {todos.map((task) => {
                  const isSelected = selectedTasks.includes(task.title);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleSelectTask(task.title)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400/40 text-white font-semibold'
                          : 'bg-navy-950/40 border-white/5 text-slate-300 hover:bg-navy-900/60'
                      }`}
                    >
                      <span className="text-xs truncate mr-2">{task.title}</span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-royal-600 via-royal-500 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Tomorrow&apos;s Plan &amp; Complete Habit</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
