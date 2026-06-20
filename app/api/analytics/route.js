import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, getSubcategories, getTasks, getAllLogs } from '@/lib/storage';
import {
  calculateWeeklyData,
  calculateMonthlyData,
  calculateCategoryBreakdown,
  calculateStreak,
  calculateHeatmapData,
  calculateWeeklyScore,
  getPriorityDistribution,
  calculateWeeklyHabitConsistency,
} from '@/lib/analytics';
import { format } from 'date-fns';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

export async function GET(request) {
  try {
    const session = await authenticate();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    const [categories, subcategories, tasks, allLogs] = await Promise.all([
      getCategories(session.userId),
      getSubcategories(session.userId),
      getTasks(session.userId),
      getAllLogs(session.userId, 90),
    ]);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = allLogs[today] || [];

    if (type === 'overview') {
      const weeklyData = calculateWeeklyData(allLogs, tasks);
      const streak = calculateStreak(allLogs);
      const weeklyScore = calculateWeeklyScore(allLogs);
      const todayMinutes = todayLogs.reduce((s, l) => s + (l.minutesSpent || 0), 0);
      const todayCompleted = todayLogs.filter((l) => l.completed).length;

      return NextResponse.json({
        totalTasks: tasks.length,
        todayCompleted,
        todayMinutes,
        weeklyScore,
        streak,
        completionRate: tasks.length
          ? Math.round((todayCompleted / Math.max(tasks.length, 1)) * 100)
          : 0,
        activeCategories: categories.length,
        weeklyData,
      });
    }

    if (type === 'weekly') {
      return NextResponse.json(calculateWeeklyData(allLogs, tasks));
    }

    if (type === 'monthly') {
      return NextResponse.json(calculateMonthlyData(allLogs));
    }

    if (type === 'categories') {
      return NextResponse.json(calculateCategoryBreakdown(allLogs, tasks, subcategories, categories));
    }

    if (type === 'heatmap') {
      return NextResponse.json(calculateHeatmapData(allLogs));
    }

    if (type === 'priority') {
      return NextResponse.json(getPriorityDistribution(tasks));
    }

    if (type === 'weekly-habits') {
      return NextResponse.json(calculateWeeklyHabitConsistency(allLogs, tasks, subcategories, categories));
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
