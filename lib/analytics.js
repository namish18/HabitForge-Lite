import { format, subDays, parseISO, isValid } from 'date-fns';

/**
 * Calculate analytics data from raw storage data
 */

export function calculateDailyStats(logs, tasks) {
  const totalMinutes = logs.reduce((sum, l) => sum + (l.minutesSpent || 0), 0);
  const completedTasks = logs.filter((l) => l.completed).length;
  return { totalMinutes, completedTasks, totalLogs: logs.length };
}

export function calculateWeeklyData(allLogs, tasks) {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const logs = allLogs[date] || [];
    const totalMinutes = logs.reduce((sum, l) => sum + (l.minutesSpent || 0), 0);
    const completed = logs.filter((l) => l.completed).length;
    data.push({
      date,
      label: format(subDays(new Date(), i), 'EEE'),
      totalMinutes,
      completed,
      focusHours: Math.round((totalMinutes / 60) * 10) / 10,
    });
  }
  return data;
}

export function calculateMonthlyData(allLogs) {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const logs = allLogs[date] || [];
    const totalMinutes = logs.reduce((sum, l) => sum + (l.minutesSpent || 0), 0);
    const completed = logs.filter((l) => l.completed).length;
    data.push({
      date,
      label: format(subDays(new Date(), i), 'MMM d'),
      totalMinutes,
      completed,
      focusHours: Math.round((totalMinutes / 60) * 10) / 10,
    });
  }
  return data;
}

export function calculateCategoryBreakdown(allLogs, tasks, subcategories, categories) {
  const categoryMap = {};

  Object.values(allLogs).forEach((logs) => {
    logs.forEach((log) => {
      const task = tasks.find((t) => t.id === log.taskId);
      if (!task) return;
      const sub = subcategories.find((s) => s.id === task.subcategoryId);
      if (!sub) return;
      const cat = categories.find((c) => c.id === sub.categoryId);
      if (!cat) return;

      if (!categoryMap[cat.id]) {
        categoryMap[cat.id] = {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          totalMinutes: 0,
          completedTasks: 0,
        };
      }
      categoryMap[cat.id].totalMinutes += log.minutesSpent || 0;
      if (log.completed) categoryMap[cat.id].completedTasks += 1;
    });
  });

  return Object.values(categoryMap).sort((a, b) => b.totalMinutes - a.totalMinutes);
}

export function calculateStreak(allLogs) {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i <= 365; i++) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const logs = allLogs[date] || [];
    const hasActivity = logs.some((l) => (l.minutesSpent || 0) > 0 || l.completed);
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function calculateHeatmapData(allLogs) {
  const result = {};
  for (let i = 364; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const logs = allLogs[date] || [];
    const totalMinutes = logs.reduce((sum, l) => sum + (l.minutesSpent || 0), 0);
    result[date] = {
      date,
      totalMinutes,
      count: logs.length,
      level: getActivityLevel(totalMinutes),
    };
  }
  return result;
}

function getActivityLevel(minutes) {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

export function calculateWeeklyScore(allLogs) {
  const weekData = calculateWeeklyData(allLogs, []);
  const totalMinutes = weekData.reduce((sum, d) => sum + d.totalMinutes, 0);
  const activeDays = weekData.filter((d) => d.totalMinutes > 0).length;
  const score = Math.min(100, Math.round((totalMinutes / 420) * 50 + (activeDays / 7) * 50));
  return score;
}

export function getPriorityDistribution(tasks) {
  const dist = { low: 0, medium: 0, high: 0 };
  tasks.forEach((t) => {
    if (dist[t.priority] !== undefined) dist[t.priority]++;
  });
  return [
    { name: 'Low', value: dist.low, color: '#6ee7b7' },
    { name: 'Medium', value: dist.medium, color: '#fbbf24' },
    { name: 'High', value: dist.high, color: '#febfca' },
  ].filter((d) => d.value > 0);
}
