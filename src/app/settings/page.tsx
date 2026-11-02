'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Activity, ActivityType } from '@/types/activity';
import { IconRenderer } from '@/components/ui/IconRenderer';
import SettingsLoading from './loading';
import {
  Settings,
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Download,
  Upload,
  LogOut,
  Smartphone,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  isSoundEnabled,
  setSoundEnabled,
  playCheckPop,
  playCompleteFanfare,
  playVoiceCue,
} from '@/lib/audio/sound';

const ICON_OPTIONS = [
  'CheckCircle', 'Footprints', 'Flame', 'Droplet', 'Moon', 'Code',
  'CheckSquare', 'Dumbbell', 'BookOpen', 'Coffee', 'Heart', 'Zap', 'Award'
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useAppStore();
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playCheckPop();
  };

  // New activity form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('CheckCircle');
  const [newType, setNewType] = useState<ActivityType>('check');
  const [newTarget, setNewTarget] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchActivities();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities in settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActivity = async (activity: Activity) => {
    setSavingId(activity.id);
    try {
      await fetch('/api/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      await fetchActivities();
    } catch (err) {
      console.error('Failed to update activity:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const targetVal = parseFloat(newTarget) || 1;
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          icon: newIcon,
          type: newType,
          daily_target: targetVal,
          unit: newUnit.trim(),
          sort_order: activities.length + 1,
          is_active: true,
        }),
      });

      if (res.ok) {
        setNewName('');
        setNewUnit('');
        setShowAddForm(false);
        await fetchActivities();
      }
    } catch (err) {
      console.error('Failed to create activity:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteActivity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await fetch(`/api/activities?id=${id}`, { method: 'DELETE' });
      await fetchActivities();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setNotificationStatus(result);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBackupStatus('Importing backup...');
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const resJson = await res.json();
      if (!res.ok) {
        setBackupStatus(`Import failed: ${resJson.error || 'Invalid file format'}`);
      } else {
        setBackupStatus(`Successfully imported ${resJson.importedActivities} activities & ${resJson.importedLogs} logs!`);
        fetchActivities();
      }
    } catch (err: any) {
      setBackupStatus(`Error: ${err.message || 'Failed reading JSON file'}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return <SettingsLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>App Settings &amp; Preferences</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Customize your daily tracking habits, notifications, themes, and backups.
        </p>
      </div>

      {/* Section 1: Manage Activities & Targets */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-4 shadow-glass">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Daily Habit Goals</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust targets, create custom habits, or archive items dynamically.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-royal-600 to-cyan-400 text-slate-950 shadow-glow-cyan hover:opacity-95 transition-all cursor-pointer"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{showAddForm ? 'Cancel' : 'Add Habit'}</span>
          </button>
        </div>

        {/* Add New Activity Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateActivity}
            className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-3.5 animate-fadeIn"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New Dynamic Habit</span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Habit Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Read 20 pages"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="check">Check (Yes/No)</option>
                  <option value="number">Number (Target)</option>
                  <option value="duration">Duration (Minutes)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Icon</label>
                <select
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {ICON_OPTIONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {newType !== 'check' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Daily Target</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. pages, mins, cups"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 shadow-glow-cyan hover:opacity-95 transition-all cursor-pointer"
            >
              {creating ? 'Adding...' : 'Save & Track Habit'}
            </button>
          </form>
        )}

        {/* Existing Activities List */}
        <div className="space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <IconRenderer name={act.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200 truncate">{act.name}</span>
                </div>

                {/* Right controls: Active Toggle & Delete */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateActivity({ ...act, is_active: !act.is_active })}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      act.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {act.is_active ? 'Active' : 'Archived'}
                  </button>

                  <button
                    onClick={() => handleDeleteActivity(act.id, act.name)}
                    title="Delete habit"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Target & Unit Inputs for numeric/duration */}
              {act.type !== 'check' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Daily Target</label>
                    <input
                      type="number"
                      step="any"
                      defaultValue={act.daily_target}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== act.daily_target) {
                          handleUpdateActivity({ ...act, daily_target: val });
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Unit</label>
                    <input
                      type="text"
                      defaultValue={act.unit}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== act.unit) {
                          handleUpdateActivity({ ...act, unit: val });
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Notifications & Reminders */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3 shadow-glass">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Daily Reminders</h3>
        </div>
        <p className="text-xs text-slate-400">
          Browser notifications alert you when it&apos;s time to log your evening steps or workout.
        </p>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-300">
            Permission: <strong className="text-cyan-300 capitalize">{notificationStatus}</strong>
          </span>

          {notificationStatus !== 'granted' ? (
            <button
              onClick={handleRequestNotifications}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-royal-600 hover:bg-royal-500 text-white shadow-glow-blue transition-colors cursor-pointer"
            >
              Enable Notifications
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Enabled
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Note: iOS Safari requires DayLog to be added to the Home Screen before Web Push / Notification permissions can be prompted.
        </p>
      </div>

      {/* Section 3: Theme */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3 shadow-glass">
        <h3 className="text-sm font-bold text-slate-200">UI Theme</h3>
        <p className="text-xs text-slate-400">
          Choose your interface style. Changes take effect instantly and persist across sessions.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => useAppStore.getState().setTheme('dark')}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-royal-600/20 border-cyan-400/60 shadow-glow-cyan text-white font-bold'
                : 'bg-navy-950/40 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="text-xs font-bold">Dark Mode</div>
              <div className="text-[10px] text-slate-400">Deep Navy &amp; Glow</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => useAppStore.getState().setTheme('light')}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-royal-600/20 border-cyan-400/60 shadow-glow-cyan text-white font-bold'
                : 'bg-navy-950/40 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-xs font-bold">Light Mode</div>
              <div className="text-[10px] text-slate-400">Crisp Slate &amp; Blue</div>
            </div>
          </button>
        </div>
      </div>

      {/* Section 4: Sound, Audio Cues & Haptics */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3.5 shadow-glass">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Audio Feedback &amp; Voice Cues</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tactile audio chimes, celebratory fanfares, and hands-free workout voice prompts.
            </p>
          </div>

          <button
            onClick={handleToggleSound}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              soundActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
            title={soundActive ? 'Sound is Enabled' : 'Sound is Muted'}
          >
            {soundActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              playCheckPop();
              setTimeout(() => playCompleteFanfare(), 250);
            }}
            disabled={!soundActive}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Test Chimes</span>
          </button>

          <button
            type="button"
            onClick={() => playVoiceCue('Voice cues ready. Halfway mark reached!')}
            disabled={!soundActive}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Test Voice Cue</span>
          </button>
        </div>
      </div>

      {/* Section 5: JSON Backup Export & Import */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3 shadow-glass">
        <h3 className="text-sm font-bold text-slate-200">Data Backup &amp; Portability</h3>
        <p className="text-xs text-slate-400">
          Export your complete tracking records and habit configurations as structured JSON, or restore a previous backup.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportBackup}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        </div>

        {backupStatus && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-300 text-xs">
            {backupStatus}
          </div>
        )}
      </div>

      {/* Section 5: PWA Help & Installation */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-2 shadow-glass">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Installing DayLog as an App</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          • <strong>iPhone / iPad:</strong> Open in Safari, tap the Share icon at the bottom, and select <em>Add to Home Screen</em>.<br />
          • <strong>Android / Chrome:</strong> Tap the 3 dots menu in Chrome and select <em>Install App</em> or <em>Add to Home screen</em>.
        </p>
      </div>

      {/* Section 6: Lock & Sign Out */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-2xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Lock DayLog Session &amp; Sign Out</span>
        </button>
      </div>
    </div>
  );
}
