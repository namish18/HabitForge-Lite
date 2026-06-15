'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import styles from './WeeklyHabitSummary.module.css';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#252525',
    border: '1px solid #383838',
    borderRadius: 8,
    color: '#f0f0f0',
    fontSize: 12,
  },
};

export default function WeeklyHabitSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedHabit, setExpandedHabit] = useState(null);

  useEffect(() => {
    fetch('/api/analytics?type=weekly-habits')
      .then((r) => r.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="loading-spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>No data available</p>
      </div>
    );
  }

  const { weeklyStats, habits } = data;
  const completionPercentage = weeklyStats.overallCompletionRate;
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#6ee7b7';
    if (percentage >= 60) return '#fbbf24';
    if (percentage >= 40) return '#f97316';
    return '#f87171';
  };

  const weekData = weeklyStats.weekDates.map((date, idx) => {
    const dayCompletions = habits.reduce((sum, habit) => {
      const activity = habit.weekActivity.find((a) => a.date === date);
      return sum + (activity?.completed ? 1 : 0);
    }, 0);
    return {
      date: weeklyStats.weekLabels[idx],
      completed: dayCompletions,
      total: habits.filter((h) => h.totalLogged > 0).length,
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Weekly Habit Consistency</h2>
        <div className={styles.badge}>{weeklyStats.habitsTrackedThisWeek} habits tracked</div>
      </div>

      {/* Overall Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Completion Rate</div>
          <div className={styles.circleProgress}>
            <svg viewBox="0 0 100 100" className={styles.circleProgressSvg}>
              <circle cx="50" cy="50" r="45" className={styles.progressBg} />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={styles.progressFill}
                style={{
                  strokeDasharray: `${completionPercentage * 2.83} 282.7`,
                  stroke: getProgressColor(completionPercentage),
                }}
              />
            </svg>
            <div className={styles.progressText}>{completionPercentage}%</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Completed Tasks</div>
          <div className={styles.statValue} style={{ color: '#6ee7b7' }}>
            {weeklyStats.totalCompleted}
          </div>
          <div className={styles.statSub}>this week</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Missed Tasks</div>
          <div className={styles.statValue} style={{ color: '#f87171' }}>
            {weeklyStats.totalMissed}
          </div>
          <div className={styles.statSub}>this week</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Logged</div>
          <div className={styles.statValue} style={{ color: '#60a5fa' }}>
            {weeklyStats.totalLogged}
          </div>
          <div className={styles.statSub}>entries</div>
        </div>
      </div>

      {/* Daily Completion Chart */}
      {weekData.some((d) => d.total > 0) && (
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>Daily Completion</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="completed" fill="#febfca" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Habits List */}
      <div className={styles.habitsSection}>
        <h3 className={styles.habitsTitle}>Habit Tracking</h3>
        {habits.length === 0 ? (
          <p className={styles.emptyMessage}>No habits to track</p>
        ) : (
          <div className={styles.habitsList}>
            {habits.map((habit) => (
              <div key={habit.id} className={styles.habitCard}>
                <div
                  className={styles.habitHeader}
                  onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
                >
                  <div className={styles.habitInfo}>
                    <div
                      className={styles.categoryBadge}
                      style={{ backgroundColor: habit.categoryColor }}
                    >
                      {habit.category.substring(0, 1)}
                    </div>
                    <div className={styles.habitMeta}>
                      <div className={styles.habitTitle}>{habit.title}</div>
                      <div className={styles.habitCategory}>{habit.category}</div>
                    </div>
                  </div>
                  <div className={styles.habitStats}>
                    <div className={styles.completionBadge} style={{ color: getProgressColor(habit.completionRate) }}>
                      {habit.completionRate}%
                    </div>
                    <div className={styles.expandIcon}>
                      {expandedHabit === habit.id ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {expandedHabit === habit.id && (
                  <div className={styles.habitDetails}>
                    <div className={styles.weekGrid}>
                      {habit.weekActivity.map((activity, idx) => (
                        <div key={activity.date} className={styles.dayCell}>
                          <div className={styles.dayLabel}>{weeklyStats.weekLabels[idx]}</div>
                          <div
                            className={`${styles.dayStatus} ${activity.completed ? styles.completed : styles.missed}`}
                            title={activity.completed ? 'Completed' : 'Missed'}
                          >
                            {activity.completed ? '✓' : '✗'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.habitSummary}>
                      <span>{habit.completedDays} completed</span>
                      <span className={styles.separator}>•</span>
                      <span>{habit.missedDays} missed</span>
                      <span className={styles.separator}>•</span>
                      <span>{habit.totalLogged} logged</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
