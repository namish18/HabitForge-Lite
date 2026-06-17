'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import WeeklyHabitSummary from '@/components/WeeklyHabitSummary/WeeklyHabitSummary';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics?type=overview')
      .then((r) => r.json())
      .then((data) => { setOverview(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-overlay">
          <div className="loading-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Tasks', value: overview?.totalTasks ?? 0, icon: '✅', sub: 'All time' },
    { label: 'Completed Today', value: overview?.todayCompleted ?? 0, icon: '🎯', sub: 'Today' },
    { label: 'Focus Time', value: formatMinutes(overview?.todayMinutes ?? 0), icon: '⏱️', sub: 'Today' },
    { label: 'Weekly Score', value: `${overview?.weeklyScore ?? 0}%`, icon: '📈', sub: 'This week' },
    { label: 'Current Streak', value: `${overview?.streak ?? 0}d`, icon: '🔥', sub: 'Days active' },
    { label: 'Completion Rate', value: `${overview?.completionRate ?? 0}%`, icon: '💪', sub: 'Today' },
    { label: 'Categories', value: overview?.activeCategories ?? 0, icon: '📂', sub: 'Active' },
  ];

  const weeklyData = overview?.weeklyData || [];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your productivity at a glance</p>
        </div>
        <Link href="/tasks" className="btn btn-primary" id="dashboard-add-task">
          <span>+</span> New Task
        </Link>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly Habit Consistency Summary */}
      <WeeklyHabitSummary />

      {/* Weekly Chart */}
      <div className={`card ${styles.chartCard}`}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Weekly Focus Hours</h2>
          <span className="badge badge-pink">Last 7 days</span>
        </div>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#febfca" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#febfca" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={{
                  background: '#252525',
                  border: '1px solid #383838',
                  borderRadius: 8,
                  color: '#f0f0f0',
                  fontSize: 12,
                }}
                formatter={(v) => [`${v}h`, 'Focus Hours']}
              />
              <Area
                type="monotone"
                dataKey="focusHours"
                stroke="#febfca"
                strokeWidth={2}
                fill="url(#focusGrad)"
                dot={{ fill: '#febfca', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#febfca', stroke: '#f9a0b0', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-title">No data yet</p>
            <p className="empty-state-description">Start tracking your tasks to see analytics here.</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        {[
          { href: '/categories', icon: '📂', label: 'Manage Categories', desc: 'Organize your work' },
          { href: '/tasks', icon: '✅', label: 'View Tasks', desc: 'Manage your to-dos' },
          { href: '/timer', icon: '⏱️', label: 'Start Timer', desc: 'Focus on a task' },
          { href: '/analytics', icon: '📊', label: 'View Analytics', desc: 'Deep dive into data' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className={styles.quickLink}>
            <span className={styles.quickIcon}>{link.icon}</span>
            <div>
              <div className={styles.quickLabel}>{link.label}</div>
              <div className={styles.quickDesc}>{link.desc}</div>
            </div>
            <span className={styles.quickArrow}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatMinutes(mins) {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
