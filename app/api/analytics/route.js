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
} from '@/lib/analytics';
import { format } from 'date-fns';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

export async function GET() {
  try {
    const session = await authenticate();

    const categories = await getCategories(session.userId);

    return NextResponse.json(categories);

  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        status: error.status
      },
      { status: 500 }
    );
  }
}