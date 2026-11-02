'use client';

import React, { useState } from 'react';
import { ActivityWithLog } from '@/types/activity';
import { queueLogUpsert } from '@/lib/storage/sync';
import { useAppStore } from '@/store/useAppStore';
import { playCheckPop, playCompleteFanfare } from '@/lib/audio/sound';
import { Droplets, Plus, Minus, Check, X, Sparkles } from 'lucide-react';

interface WaterSipModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  activity: ActivityWithLog;
  onLogged?: () => void;
}

export const WaterSipModal: React.FC<WaterSipModalProps> = ({
  isOpen,
  onClose,
  date,
  activity,
  onLogged,
}) => {
  const triggerConfetti = useAppStore((state) => state.triggerConfetti);
  const [currentVal, setCurrentVal] = useState<number>(() => Number(activity.value) || 0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const target = Number(activity.daily_target) || 3;
  const isLiters = activity.unit.toLowerCase() === 'l' || activity.unit.toLowerCase() === 'liters';
  const progressPct = Math.min(100, Math.round((currentVal / target) * 100));

  const handleAddSip = async (amount: number) => {
    const nextVal = Math.max(0, Math.round((currentVal + amount) * 100) / 100);
    setCurrentVal(nextVal);
    playCheckPop();

    if (currentVal < target && nextVal >= target) {
      triggerConfetti();
      playCompleteFanfare();
    }

    setSaving(true);
    try {
      await queueLogUpsert(activity.id, date, nextVal, activity.note, activity.link);
      onLogged?.();
    } finally {
      setSaving(false);
    }
  };

  const sipPresets = isLiters
    ? [
        { label: '+250 ml', amount: 0.25, icon: '💧', sub: 'Glass' },
        { label: '+500 ml', amount: 0.5, icon: '🧴', sub: 'Bottle' },
        { label: '+750 ml', amount: 0.75, icon: '🥤', sub: 'Shaker' },
        { label: '+1.0 L', amount: 1.0, icon: '🫙', sub: 'Pitcher' },
      ]
    : [
        { label: '+250', amount: 250, icon: '💧', sub: 'Glass' },
        { label: '+500', amount: 500, icon: '🧴', sub: 'Bottle' },
        { label: '+750', amount: 750, icon: '🥤', sub: 'Shaker' },
        { label: '+1000', amount: 1000, icon: '🫙', sub: 'Pitcher' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-cyan-500/30 shadow-glass relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
          <Droplets className="w-3.5 h-3.5" />
          <span>Hydration Quick-Sip</span>
        </div>

        <h3 className="text-xl font-black text-white tracking-tight">{activity.name}</h3>

        {/* Visual Water Tank / Bottle Graphic */}
        <div className="my-6 relative flex flex-col items-center justify-center">
          <div className="w-36 h-48 rounded-3xl border-2 border-cyan-400/40 p-1 relative overflow-hidden bg-navy-950/60 shadow-inner">
            {/* Water Fill Level */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 via-cyan-500 to-cyan-400 transition-all duration-500 rounded-b-2xl opacity-85"
              style={{ height: `${progressPct}%` }}
            >
              {/* Wave shimmer effect */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 animate-pulse" />
            </div>

            {/* Measurement lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-40">
              <div className="border-b border-white/30 w-4 text-[9px] text-white">100%</div>
              <div className="border-b border-white/30 w-3 text-[9px] text-white">75%</div>
              <div className="border-b border-white/30 w-4 text-[9px] text-white">50%</div>
              <div className="border-b border-white/30 w-3 text-[9px] text-white">25%</div>
            </div>

            {/* Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <span className="text-3xl font-black text-white drop-shadow-md">
                {currentVal}
              </span>
              <span className="text-xs font-bold text-white/90 drop-shadow">
                of {target} {activity.unit}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 mt-1 rounded-full bg-navy-950/70 text-cyan-300 border border-cyan-400/30">
                {progressPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Sip Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {sipPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleAddSip(preset.amount)}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 border border-cyan-500/20 text-white transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-base">{preset.icon}</span>
                <div>
                  <div className="text-xs font-bold text-cyan-300">{preset.label}</div>
                  <div className="text-[10px] text-slate-400">{preset.sub}</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Stepper controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleAddSip(isLiters ? -0.25 : -250)}
            disabled={currentVal <= 0}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 flex items-center justify-center border border-slate-700 cursor-pointer"
            title="Subtract 250ml"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-royal-600 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-cyan transition-all cursor-pointer"
          >
            Done Logging
          </button>
        </div>
      </div>
    </div>
  );
};
