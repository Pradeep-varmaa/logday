'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TodoItem, TodoPriority } from '@/types/activity';
import { ListTodo, Plus, Check, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCheckPop } from '@/lib/audio/sound';

export const DashboardTodosWidget: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New task input state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TodoPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchPendingTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos?incomplete=true');
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending todos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingTodos();
  }, [fetchPendingTodos]);

  const handleToggleComplete = async (todo: TodoItem) => {
    setCompletingId(todo.id);
    playCheckPop();

    // Optimistic removal so after check only the list will empty instantly
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));

    // Celebratory confetti burst
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22d3ee', '#1d4ed8', '#6366f1', '#10b981'],
      });
    } catch (_) {}

    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todo.id, is_completed: true }),
      });

      if (!res.ok) {
        // Rollback if server failed
        fetchPendingTodos();
      }
    } catch (err) {
      fetchPendingTodos();
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: newPriority,
        }),
      });

      if (res.ok) {
        const created: TodoItem = await res.json();
        setTodos((prev) => [created, ...prev]);
        setNewTitle('');
      }
    } catch (err) {
      console.error('Failed to create todo:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: TodoPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Med
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Low
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-royal-950/30 via-navy-900/40 to-slate-900/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Pending Tasks
              {todos.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {todos.length}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Open tasks carry over until checked
            </p>
          </div>
        </div>

        <Link
          href="/tasks"
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleCreateTodo} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add an open task..."
            maxLength={255}
            className="w-full bg-navy-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/25 transition-all"
          />
        </div>

        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as TodoPriority)}
          className="bg-navy-950/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
        >
          <option value="high">High</option>
          <option value="medium">Med</option>
          <option value="low">Low</option>
        </select>

        <button
          type="submit"
          disabled={!newTitle.trim() || submitting}
          className="p-2 rounded-xl bg-royal-600 hover:bg-royal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer shrink-0"
          title="Add task"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Incomplete Tasks List */}
      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading tasks...</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-navy-950/30 p-4 text-center">
          <p className="text-xs text-slate-400 font-medium">
            🎉 All caught up! No pending tasks.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Add any task above and it will stay here until completed.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => {
            const isToggling = completingId === todo.id;
            return (
              <div
                key={todo.id}
                className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-navy-950/40 hover:bg-navy-900/60 border border-white/5 hover:border-cyan-500/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    disabled={isToggling}
                    className="w-6 h-6 rounded-lg border-2 border-slate-500 hover:border-cyan-400 group-hover:border-cyan-400/80 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Mark as completed (clears task from pending list)"
                  >
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : null}
                  </button>

                  <span className="text-xs text-slate-200 font-medium truncate group-hover:text-white">
                    {todo.title}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {getPriorityBadge(todo.priority)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
