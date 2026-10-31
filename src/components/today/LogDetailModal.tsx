'use client';

import React, { useState, useEffect } from 'react';
import { ActivityWithLog } from '@/types/activity';
import { queueLogUpsert } from '@/lib/storage/sync';
import { X, Save, Camera, MessageSquare } from 'lucide-react';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  activity: ActivityWithLog | null;
  onSaved?: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  activity,
  onSaved,
}) => {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activity) {
      setValue(String(activity.value ?? ''));
      setNote(activity.note || '');
      setLink(activity.link || '');
    }
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const numVal = parseFloat(value) || 0;

    await queueLogUpsert(activity.id, date, numVal, note.trim() || null, link.trim() || null);
    setSaving(false);
    onSaved?.();
    onClose();
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

        <h2 className="text-base font-bold text-white mb-1">{activity.name}</h2>
        <p className="text-xs text-slate-400 mb-4">Edit value, notes, and links for {date}</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Logged Amount {activity.unit ? `(${activity.unit})` : ''}
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Target: ${activity.daily_target}`}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personal Note</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Great pace, felt energetic"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram Post Link</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-royal-600 to-cyan-400 shadow-glow-cyan flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{saving ? 'Saving...' : 'Save Entry'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
