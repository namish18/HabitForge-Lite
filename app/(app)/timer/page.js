'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/appStore';
import { format } from 'date-fns';
import styles from './timer.module.css';
import {
  encryptWithSession,
  decryptWithSession,
  isEncryptedPayload,
  hasSessionPassword,
} from '@/lib/crypto';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TimerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTaskId = searchParams.get('taskId');

  const { timer, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer } = useAppStore();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(preselectedTaskId || '');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  // sessions holds the DECRYPTED log array for today, used to display and to
  // build the updated collection before re-encrypting on save.
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!hasSessionPassword()) { router.push('/login'); return; }
    Promise.all([
      fetch('/api/tasks').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/subcategories').then((r) => r.json()),
    ]).then(async ([tP, cP, sP]) => {
      setTasks(await safeDecrypt(tP, []));
      setCategories(await safeDecrypt(cP, []));
      setSubcategories(await safeDecrypt(sP, []));
    }).catch(() => {});
    loadTodaySessions();
  }, []);

  useEffect(() => {
    if (preselectedTaskId) setSelectedTaskId(preselectedTaskId);
  }, [preselectedTaskId]);

  async function safeDecrypt(payload, fallback) {
    if (payload === null || payload === undefined) return fallback;
    if (!isEncryptedPayload(payload)) return fallback;
    return decryptWithSession(payload);
  }

  async function loadTodaySessions() {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const payload = await fetch(`/api/logs?date=${today}`).then((r) => r.json());
      setSessions(await safeDecrypt(payload, []));
    } catch {}
  }

  function handleStart() {
    if (!selectedTaskId) return toast.error('Select a task first');
    startTimer(selectedTaskId);
  }

  function handlePause() { pauseTimer(); }
  function handleResume() { resumeTimer(); }

  async function handleStop() {
    if (!timer.taskId) return;
    const minutes = stopTimer();
    if (minutes < 1) {
      toast('Session too short (< 1 min), not saved', { icon: '⚠️' });
      return;
    }
    setSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const newEntry = {
        id: uuidv4(),
        taskId: timer.taskId,
        date: today,
        minutesSpent: minutes,
        completed,
        notes,
      };
      // Append to the already-decrypted sessions list (no extra network round-trip)
      const updated = [...sessions, newEntry];
      const encryptedPayload = await encryptWithSession(updated);

      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, encryptedPayload }),
      });
      if (!res.ok) throw new Error('Save failed');

      toast.success(`Session saved: ${minutes} minutes`);
      setNotes('');
      setCompleted(false);
      await loadTodaySessions();
    } catch {
      toast.error('Failed to save session');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (timer.isRunning || timer.isPaused) {
      if (!confirm('Reset timer? Session will be lost.')) return;
    }
    resetTimer();
  }

  const selectedTask = tasks.find((t) => t.id === (timer.taskId || selectedTaskId));
  const progress = selectedTask ? Math.min(100, Math.round((timer.elapsed / 60 / selectedTask.targetMinutes) * 100)) : 0;
  const circumference = 2 * Math.PI * 110;
  const strokeDash = circumference - (progress / 100) * circumference;

  function getTaskDisplay(task) {
    const sub = subcategories.find((s) => s.id === task.subcategoryId);
    const cat = sub ? categories.find((c) => c.id === sub.categoryId) : null;
    return `${cat?.icon || ''} ${cat?.name || ''} / ${sub?.name || ''} / ${task.title}`;
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Focus Timer</h1>
          <p className="page-subtitle">Track your deep work sessions</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={`card ${styles.timerCard}`}>
          <div className={styles.circleWrap}>
            <svg className={styles.circle} viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="110" fill="none" stroke="var(--border-soft)" strokeWidth="8" />
              <circle
                cx="120" cy="120" r="110"
                fill="none"
                stroke="var(--pink)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDash}
                transform="rotate(-90 120 120)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className={styles.circleContent}>
              <div className={styles.timerDisplay}>{formatTime(timer.elapsed)}</div>
              {selectedTask && (
                <div className={styles.timerProgress}>{progress}% of {selectedTask.targetMinutes}m</div>
              )}
              <div className={`${styles.timerStatus} ${timer.isRunning ? styles.running : timer.isPaused ? styles.paused : ''}`}>
                {timer.isRunning ? '● Recording' : timer.isPaused ? '⏸ Paused' : '○ Ready'}
              </div>
            </div>
          </div>

          {!timer.isRunning && !timer.isPaused && (
            <div className={styles.taskSelect}>
              <label className="form-label">Select Task</label>
              <select className="form-select" value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)} id="timer-task-select">
                <option value="">Choose a task...</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{getTaskDisplay(t)}</option>
                ))}
              </select>
            </div>
          )}

          {selectedTask && (timer.isRunning || timer.isPaused) && (
            <div className={styles.activeTask}>
              <div className={styles.activeTaskLabel}>Working on</div>
              <div className={styles.activeTaskName}>{selectedTask.title}</div>
            </div>
          )}

          <div className={styles.controls}>
            {!timer.isRunning && !timer.isPaused && (
              <button className={`btn btn-primary btn-lg ${styles.startBtn}`} onClick={handleStart} id="timer-start-btn">▶ Start Focus</button>
            )}
            {timer.isRunning && (
              <>
                <button className="btn btn-secondary btn-lg" onClick={handlePause} id="timer-pause-btn">⏸ Pause</button>
                <button className="btn btn-primary btn-lg" onClick={handleStop} disabled={saving} id="timer-stop-btn">
                  {saving ? 'Saving...' : '⏹ Stop & Save'}
                </button>
              </>
            )}
            {timer.isPaused && (
              <>
                <button className="btn btn-primary btn-lg" onClick={handleResume} id="timer-resume-btn">▶ Resume</button>
                <button className="btn btn-secondary btn-lg" onClick={handleStop} disabled={saving} id="timer-save-btn">
                  {saving ? 'Saving...' : '⏹ Save Session'}
                </button>
              </>
            )}
            {(timer.isRunning || timer.isPaused) && (
              <button className="btn btn-ghost" onClick={handleReset} id="timer-reset-btn">↺ Reset</button>
            )}
          </div>

          {(timer.isRunning || timer.isPaused) && (
            <div className={styles.sessionMeta}>
              <div className="form-group">
                <label className="form-label">Session Notes</label>
                <textarea className="form-textarea" placeholder="What did you accomplish?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <label className={styles.completedCheck}>
                <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} id="mark-completed" />
                <span>Mark task as completed for today</span>
              </label>
            </div>
          )}
        </div>

        <div className={styles.sessionsPanel}>
          <h3 className="section-title">Today's Sessions</h3>
          {sessions.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon" style={{ fontSize: '2rem' }}>⏱️</div>
              <p className="empty-state-title">No sessions yet</p>
              <p className="empty-state-description">Start a timer to record your first session.</p>
            </div>
          ) : (
            <div className={styles.sessionList}>
              {sessions.map((s) => {
                const task = tasks.find((t) => t.id === s.taskId);
                return (
                  <div key={s.id} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionTask}>{task?.title || 'Unknown Task'}</div>
                      {s.notes && <div className={styles.sessionNotes}>{s.notes}</div>}
                    </div>
                    <div className={styles.sessionRight}>
                      <div className={styles.sessionTime}>{s.minutesSpent}m</div>
                      {s.completed && <span className="badge badge-green">✓ Done</span>}
                    </div>
                  </div>
                );
              })}
              <div className={styles.sessionTotal}>
                Total: {sessions.reduce((s, l) => s + (l.minutesSpent || 0), 0)}m focused
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="page-wrapper"><div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div></div>}>
      <TimerContent />
    </Suspense>
  );
}
