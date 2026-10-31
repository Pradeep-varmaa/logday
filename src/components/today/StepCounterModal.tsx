'use client';

import React, { useState, useEffect } from 'react';
import { motionStepsProvider } from '@/lib/steps/motion';
import { manualStepsProvider } from '@/lib/steps/manual';
import { queueLogUpsert } from '@/lib/storage/sync';
import { useAppStore } from '@/store/useAppStore';
import { Footprints, AlertTriangle, Plus, Check, X, Smartphone } from 'lucide-react';

interface StepCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  activityId: string;
  currentSteps: number;
  onLogged?: () => void;
}

export const StepCounterModal: React.FC<StepCounterModalProps> = ({
  isOpen,
  onClose,
  date,
  activityId,
  currentSteps,
  onLogged,
}) => {
  const triggerConfetti = useAppStore((state) => state.triggerConfetti);
  const [activeTab, setActiveTab] = useState<'manual' | 'live'>('manual');
  const [customValue, setCustomValue] = useState(String(currentSteps || ''));
  const [liveSteps, setLiveSteps] = useState(0);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [motionSupported, setMotionSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setCustomValue(String(currentSteps || ''));
    motionStepsProvider.isAvailable().then(setMotionSupported);
  }, [currentSteps, isOpen]);

  useEffect(() => {
    return () => {
      if (isLiveActive) {
        motionStepsProvider.stopTracking();
      }
    };
  }, [isLiveActive]);

  if (!isOpen) return null;

  const handleQuickAdd = async (amount: number) => {
    const nextSteps = Math.max(0, (currentSteps || 0) + amount);
    if (nextSteps >= 10000 && (currentSteps || 0) < 10000) {
      triggerConfetti();
    }
    await queueLogUpsert(activityId, date, nextSteps);
    onLogged?.();
    onClose();
  };

  const handleSaveCustom = async () => {
    const num = parseInt(customValue, 10);
    if (isNaN(num) || num < 0) return;
    if (num >= 10000 && (currentSteps || 0) < 10000) {
      triggerConfetti();
    }
    await queueLogUpsert(activityId, date, num);
    onLogged?.();
    onClose();
  };

  const handleToggleLiveTracker = async () => {
    if (isLiveActive) {
      motionStepsProvider.stopTracking();
      setIsLiveActive(false);
      // Automatically add live steps to current
      if (liveSteps > 0) {
        const total = (currentSteps || 0) + liveSteps;
        await queueLogUpsert(activityId, date, total);
        onLogged?.();
      }
    } else {
      setErrorMsg(null);
      const success = await motionStepsProvider.startTracking((event) => {
        setLiveSteps(event.totalSteps);
      });

      if (success) {
        setIsLiveActive(true);
        setLiveSteps(0);
      } else {
        setErrorMsg('Motion sensor permission was denied or device is not supported.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-cyan-500/20 shadow-glass relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Log Steps</h2>
            <p className="text-xs text-slate-400">Daily Goal: 10,000 steps</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-1 bg-slate-900/60 rounded-xl mb-4 border border-slate-800">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-royal-600 text-white shadow-glow-blue'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'live'
                ? 'bg-royal-600 text-white shadow-glow-blue'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Sensor
          </button>
        </div>

        {/* Tab 1: Manual */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Quick Add</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickAdd(500)}
                  className="py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700/60"
                >
                  +500
                </button>
                <button
                  onClick={() => handleQuickAdd(1000)}
                  className="py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700/60"
                >
                  +1,000
                </button>
                <button
                  onClick={() => handleQuickAdd(2500)}
                  className="py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700/60"
                >
                  +2,500
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Set Total Steps</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="e.g. 10450"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleSaveCustom}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-royal-600 to-cyan-400 text-white font-semibold text-xs shadow-glow-cyan"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Experimental Live Motion */}
        {activeTab === 'live' && (
          <div className="space-y-4 text-center">
            {/* Warning banner */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Experimental:</strong> Counts steps using phone accelerometer while the app is actively open. Background counting requires native Capacitor health sync.
              </span>
            </div>

            {errorMsg && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="py-4">
              <span className="text-4xl font-extrabold text-white font-mono">{liveSteps}</span>
              <p className="text-xs text-slate-400 mt-1">Live detected steps</p>
            </div>

            <button
              onClick={handleToggleLiveTracker}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLiveActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                  : 'bg-gradient-to-r from-royal-600 to-cyan-400 text-slate-950 shadow-glow-cyan'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{isLiveActive ? 'Stop & Save Steps' : 'Start Live Step Tracking'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
