'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  calculateWeeklyData,
  calculateMonthlyData,
  calculateCategoryBreakdown,
  calculateHeatmapData,
  calculateWeeklyScore,
  calculateStreak,
  getPriorityDistribution,
} from '@/lib/analytics';
import {
  decryptWithSession,
  isEncryptedPayload,
  hasSessionPassword,
} from '@/lib/crypto';
import styles from './analytics.module.css';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#252525', border: '1px solid #383838',
    borderRadius: 8, color: '#f0f0f0', fontSize: 12,
  },
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [priority, setPriority] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!hasSessionPassword()) { router.push('/login'); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      // Single request returns all encrypted blobs for all collections + logs
      const bundle = await fetch('/api/analytics').then((r) => r.json());

      // Decrypt all collections in parallel.  Keys are cached after first derivation
      // so the cost is paid once per unique file per session.
      const [cats, subs, tasks] = await Promise.all([
        safeDecryptArray(bundle.categories),
        safeDecryptArray(bundle.subcategories),
        safeDecryptArray(bundle.tasks),
      ]);

      // Decrypt all log files in parallel
      const logEntries = await Promise.all(
        Object.entries(bundle.logs || {}).map(async ([date, payload]) => {
          const logs = await safeDecryptArray(payload);
          return [date, logs];
        })
      );
      const allLogs = Object.fromEntries(logEntries);

      // All analytics computed purely in the browser from decrypted data
      const wk    = calculateWeeklyData(allLogs, tasks);
      const mn    = calculateMonthlyData(allLogs);
      const cat   = calculateCategoryBreakdown(allLogs, tasks, subs, cats);
      const hm    = calculateHeatmapData(allLogs);
      const pr    = getPriorityDistribution(tasks);
      const score = calculateWeeklyScore(allLogs);
      const streak = calculateStreak(allLogs);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = allLogs[today] || [];
      const todayMinutes = todayLogs.reduce((s, l) => s + (l.minutesSpent || 0), 0);
      const todayCompleted = todayLogs.filter((l) => l.completed).length;

      setOverview({ weeklyScore: score, streak, todayMinutes, todayCompleted });
      setWeekly(wk);
      setMonthly(mn);
      setCategoryData(cat);
      setHeatmap(hm);
      setPriority(pr);
    } catch (e) {
      if (e.message?.includes('No active session')) { router.push('/login'); return; }
      console.error('Analytics error'); // intentionally no plaintext in error log
    } finally {
      setLoading(false);
    }
  }

  async function safeDecryptArray(payload) {
    if (!payload || !isEncryptedPayload(payload)) return [];
    return decryptWithSession(payload);
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep dive into your productivity data</p>
        </div>
      </div>

      <div className={styles.overviewGrid}>
        {[
          { label: 'Weekly Score', value: `${overview?.weeklyScore ?? 0}%`, icon: '📈', color: 'var(--pink)' },
          { label: 'Current Streak', value: `${overview?.streak ?? 0} days`, icon: '🔥', color: 'var(--yellow)' },
          { label: 'Focus Today', value: fmtMin(overview?.todayMinutes ?? 0), icon: '⏱️', color: 'var(--blue)' },
          { label: 'Completed Today', value: overview?.todayCompleted ?? 0, icon: '✅', color: 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.tabs}>
        {['overview', 'weekly', 'monthly', 'categories', 'heatmap'].map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`analytics-tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className={styles.chartsGrid}>
          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.chartTitle}>Weekly Focus Hours</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#febfca" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#febfca" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}h`, 'Focus']} />
                <Area type="monotone" dataKey="focusHours" stroke="#febfca" strokeWidth={2} fill="url(#areaGrad)" dot={{ fill: '#febfca', r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.chartTitle}>Priority Distribution</h3>
            {priority.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={priority} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {priority.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: '#a0a0a0', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.chartTitle}>Daily Completions (Week)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Completed']} />
                <Bar dataKey="completed" fill="#febfca" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {categoryData.length > 0 && (
            <div className={`card ${styles.chartCard}`}>
              <h3 className={styles.chartTitle}>Category Focus Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Math.round(v / 60)}h ${v % 60}m`, 'Focus']} />
                  <Bar dataKey="totalMinutes" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {categoryData.slice(0, 6).map((entry, i) => <Cell key={i} fill={entry.color || '#febfca'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className={styles.chartsGrid}>
          <div className={`card ${styles.chartCardWide}`}>
            <h3 className={styles.chartTitle}>7-Day Focus Hours</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#febfca" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#febfca" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}h`, 'Focus Hours']} />
                <Area type="monotone" dataKey="focusHours" stroke="#febfca" strokeWidth={2.5} fill="url(#weekGrad)" dot={{ fill: '#febfca', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={`card ${styles.chartCardWide}`}>
            <h3 className={styles.chartTitle}>Tasks Completed Per Day</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="completed" name="Completed" fill="#6ee7b7" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className={styles.chartsGrid}>
          <div className={`card ${styles.chartCardWide}`}>
            <h3 className={styles.chartTitle}>30-Day Focus Hours</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}h`, 'Focus']} />
                <Line type="monotone" dataKey="focusHours" stroke="#febfca" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#febfca' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={`card ${styles.chartCardWide}`}>
            <h3 className={styles.chartTitle}>Monthly Completions</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="completed" name="Completed" fill="#a78bfa" radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          {categoryData.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📂</div><p className="empty-state-title">No category data yet</p></div>
          ) : (
            <div className={styles.catBreakdown}>
              {categoryData.map((cat) => {
                const maxMin = Math.max(...categoryData.map((c) => c.totalMinutes), 1);
                const pct = Math.round((cat.totalMinutes / maxMin) * 100);
                return (
                  <div key={cat.id} className={`card ${styles.catRow}`}>
                    <div className={styles.catRowHeader}>
                      <div className={styles.catDot} style={{ background: cat.color }} />
                      <span className={styles.catRowName}>{cat.name}</span>
                      <span className={styles.catRowTime}>{fmtMin(cat.totalMinutes)}</span>
                      <span className="badge badge-green">{cat.completedTasks} done</span>
                    </div>
                    <div className={styles.catBar}>
                      <div className={styles.catBarFill} style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className={`card ${styles.heatmapCard}`}>
          <h3 className={styles.chartTitle}>Activity Heatmap — Last 365 Days</h3>
          <HeatmapView data={heatmap} />
          <div className={styles.heatmapLegend}>
            <span className={styles.legendLabel}>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={styles.legendCell} style={{ background: heatColor(level) }} />
            ))}
            <span className={styles.legendLabel}>More</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HeatmapView({ data }) {
  const entries = Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length === 0) return <EmptyChart />;
  const weeks = [];
  let week = [];
  entries.forEach((entry) => {
    week.push(entry);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) weeks.push(week);
  return (
    <div className={styles.heatmapWrap}>
      <div className={styles.heatmapGrid}>
        {weeks.map((w, wi) => (
          <div key={wi} className={styles.heatmapWeek}>
            {w.map((day) => (
              <div key={day.date} className={styles.heatmapCell} style={{ background: heatColor(day.level) }} title={`${day.date}: ${day.totalMinutes}m`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function heatColor(level) {
  return ['#1e1e1e', 'rgba(254,191,202,0.25)', 'rgba(254,191,202,0.5)', 'rgba(254,191,202,0.75)', '#febfca'][level] || '#1e1e1e';
}

function EmptyChart() {
  return (
    <div className="empty-state" style={{ height: 220 }}>
      <div className="empty-state-icon">📊</div>
      <p className="empty-state-description">No data yet — start tracking!</p>
    </div>
  );
}

function fmtMin(mins) {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
