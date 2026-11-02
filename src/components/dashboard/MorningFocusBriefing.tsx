'use client';

import React, { useState, useEffect } from 'react';
import { Sun, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface MorningFocusBriefingProps {
  currentDate: string; // YYYY-MM-DD
}

export const MorningFocusBriefing: React.FC<MorningFocusBriefingProps> = ({ currentDate }) => {
  const [plan, setPlan] = useState<{ tasks: string[]; note?: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/tomorrow-plan?date=${currentDate}`);
        if (res.ok) {
          const json = await res.json();
          if (json.plan && (json.plan.tasks?.length > 0 || json.plan.note)) {
            setPlan(json.plan);
          }
        }
      } catch (_) {}
    }

    loadPlan();
  }, [currentDate]);

  if (!plan || dismissed) return null;

  return (
    <div className="glass-panel rounded-3xl p-5 border border-cyan-400/30 bg-gradient-to-r from-royal-950/40 via-navy-900/60 to-cyan-950/20 relative space-y-2.5 shadow-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Morning Focus Briefing
            </h3>
            <p className="text-[11px] text-slate-400">Planned yesterday to prime your focus</p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          title="Dismiss briefing"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {plan.note && (
        <div className="p-3 rounded-2xl bg-navy-950/40 border border-white/5 text-xs text-cyan-200 font-medium italic">
          &ldquo;{plan.note}&rdquo;
        </div>
      )}

      {plan.tasks && plan.tasks.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {plan.tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-xl bg-navy-950/30 text-xs text-slate-200"
            >
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="truncate">{task}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
