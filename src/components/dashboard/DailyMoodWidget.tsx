'use client';

import React, { useState, useEffect } from 'react';
import { playCheckPop } from '@/lib/audio/sound';
import { Smile, Send, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface DailyMoodWidgetProps {
  date: string;
  initialMood?: string | null;
  initialReflection?: string | null;
  onSaved?: () => void;
}

const MOODS = [
  { id: 'energized', label: 'Energized', emoji: '⚡', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { id: 'great', label: 'Great', emoji: '😊', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
  { id: 'tired', label: 'Tired', emoji: '🥱', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' },
  { id: 'stressed', label: 'Stressed', emoji: '💥', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
];

export const DailyMoodWidget: React.FC<DailyMoodWidgetProps> = ({
  date,
  initialMood,
  initialReflection,
  onSaved,
}) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(initialMood || null);
  const [reflection, setReflection] = useState<string>(initialReflection || '');
  const [isExpanded, setIsExpanded] = useState<boolean>(Boolean(initialReflection));
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSelectedMood(initialMood || null);
    setReflection(initialReflection || '');
    if (initialReflection) setIsExpanded(true);
  }, [initialMood, initialReflection, date]);

  const handleSelectMood = async (moodId: string) => {
    const nextMood = selectedMood === moodId ? null : moodId;
    setSelectedMood(nextMood);
    playCheckPop();

    if (nextMood) {
      await saveMoodData(nextMood, reflection);
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood && !reflection.trim()) return;
    await saveMoodData(selectedMood || 'calm', reflection.trim());
  };

  const saveMoodData = async (mood: string, refl: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          mood,
          reflection: refl || null,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
        onSaved?.();
      }
    } catch (err) {
      console.error('Failed to save mood:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3 shadow-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center">
            <Smile className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Daily Check-in &amp; Mood
              {savedSuccess && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">How did today feel?</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Less' : 'Add Note'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Mood Selector Pills */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMood(m.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? `${m.color} shadow-sm scale-105 font-bold`
                  : 'bg-navy-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-navy-900/60'
              }`}
              title={m.label}
            >
              <span className="text-lg leading-none">{m.emoji}</span>
              <span className="text-[10px] font-semibold mt-1 leading-none truncate max-w-full">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Optional Reflection / One-Sentence Journal */}
      {isExpanded && (
        <form onSubmit={handleSaveReflection} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Today's win or reflection..."
            maxLength={280}
            className="flex-1 bg-navy-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
          />

          <button
            type="submit"
            disabled={saving || (!reflection.trim() && !selectedMood)}
            className="p-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            title="Save reflection"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
