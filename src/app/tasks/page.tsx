'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TodoItem, TodoPriority } from '@/types/activity';
import {
  ListTodo,
  Plus,
  Check,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCheckPop } from '@/lib/audio/sound';

type StatusFilter = 'all' | 'pending' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export default function TasksPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form input state
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  // Action states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingCompleted, setClearingCompleted] = useState(false);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/todos');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load tasks from database');
      }
      const data: TodoItem[] = await res.json();
      setTodos(data);
    } catch (err: any) {
      console.error('Error fetching todos:', err);
      setError(err.message || 'Unable to connect to database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create task');
      }

      const created: TodoItem = await res.json();
      setTodos((prev) => [created, ...prev]);
      setTitle('');
    } catch (err: any) {
      alert(err.message || 'Error creating task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTodo = async (todo: TodoItem) => {
    const nextState = !todo.is_completed;
    setTogglingId(todo.id);
    playCheckPop();

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              is_completed: nextState,
              completed_at: nextState ? new Date().toISOString() : null,
            }
          : t
      )
    );

    if (nextState) {
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22d3ee', '#38bdf8', '#6366f1', '#10b981'],
        });
      } catch (_) {}
    }

    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: todo.id,
          is_completed: nextState,
        }),
      });

      if (!res.ok) {
        fetchTodos(); // Rollback
      }
    } catch (err) {
      fetchTodos(); // Rollback
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setDeletingId(id);
    // Optimistic delete
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/todos?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        fetchTodos();
      }
    } catch (err) {
      fetchTodos();
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearCompleted = async () => {
    if (!confirm('Clear all completed tasks from your list?')) return;

    setClearingCompleted(true);
    // Optimistic removal
    setTodos((prev) => prev.filter((t) => !t.is_completed));

    try {
      const res = await fetch('/api/todos?clearCompleted=true', {
        method: 'DELETE',
      });
      if (!res.ok) {
        fetchTodos();
      }
    } catch (err) {
      fetchTodos();
    } finally {
      setClearingCompleted(false);
    }
  };

  // Filtered list
  const filteredTodos = useMemo(() => {
    return todos.filter((item) => {
      if (statusFilter === 'pending' && item.is_completed) return false;
      if (statusFilter === 'completed' && !item.is_completed) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      return true;
    });
  }, [todos, statusFilter, priorityFilter]);

  const pendingCount = todos.filter((t) => !t.is_completed).length;
  const completedCount = todos.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-1.5">
            <ListTodo className="w-3.5 h-3.5" />
            <span>Task Manager</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">To-Do List</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tasks remain active without a timeline until checked off.
          </p>
        </div>

        {completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            disabled={clearingCompleted}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {clearingCompleted ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Clear Completed ({completedCount})
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-2xl p-4 border border-white/5 bg-navy-950/40">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Pending
          </span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1">{pendingCount}</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 bg-navy-950/40">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Completed
          </span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{completedCount}</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 bg-navy-950/40">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total
          </span>
          <p className="text-2xl font-extrabold text-cyan-300 mt-1">{todos.length}</p>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-royal-950/30 via-navy-900/40 to-slate-900/40 shadow-glass">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Add New Task
        </h2>
        <form onSubmit={handleCreateTodo} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              maxLength={255}
              className="flex-1 bg-navy-950/60 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/25 transition-all"
            />

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-navy-950/60 border border-white/10 rounded-2xl p-1 shrink-0">
                {(['high', 'medium', 'low'] as TodoPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        isSelected
                          ? p === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : p === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={!title.trim() || submitting}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-royal-600 to-cyan-600 hover:from-royal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-glow-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-navy-950/60 border border-white/10 rounded-2xl p-1 self-start">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Priority:
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="bg-navy-950/60 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading tasks from database...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center border border-white/5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No tasks found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'No pending tasks! Add a task above to keep track of items.'
                : statusFilter === 'completed'
                ? 'No completed tasks yet. Check off items from your pending list.'
                : 'Your to-do list is empty. Add your first task above!'}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const isToggling = togglingId === todo.id;
            const isDeleting = deletingId === todo.id;

            return (
              <div
                key={todo.id}
                className={`group glass-panel rounded-2xl p-4 border transition-all duration-200 flex items-center justify-between gap-4 ${
                  todo.is_completed
                    ? 'border-white/5 bg-navy-950/20 opacity-70'
                    : 'border-white/10 bg-navy-900/40 hover:border-cyan-500/30 hover:bg-navy-900/60 shadow-glass'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleTodo(todo)}
                    disabled={isToggling}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      todo.is_completed
                        ? 'bg-cyan-500 border-cyan-400 text-navy-950'
                        : 'border-slate-500 hover:border-cyan-400 text-transparent'
                    }`}
                    title={todo.is_completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium break-words transition-all ${
                        todo.is_completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-100 group-hover:text-white'
                      }`}
                    >
                      {todo.title}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {todo.is_completed && todo.completed_at
                        ? `Completed ${new Date(todo.completed_at).toLocaleDateString()}`
                        : `Added ${new Date(todo.created_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                {/* Priority & Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      todo.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : todo.priority === 'medium'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {todo.priority}
                  </span>

                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
