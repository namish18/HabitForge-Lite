import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  saveProfile,
  saveCategories,
  saveSubcategories,
  saveTasks,
  saveDailyLog,
} from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

export async function POST(request) {
  try {
    const session = await authenticate();

    const backup = await request.json();

    // Validate backup
    if (
      !backup.profile ||
      !Array.isArray(backup.categories) ||
      !Array.isArray(backup.subcategories) ||
      !Array.isArray(backup.tasks) ||
      typeof backup.logs !== 'object'
    ) {
      return NextResponse.json(
        { error: 'Invalid backup format' },
        { status: 400 }
      );
    }

    // Overwrite existing data
    await saveProfile(backup.profile, session.userId);
    await saveCategories(backup.categories, session.userId);
    await saveSubcategories(backup.subcategories, session.userId);
    await saveTasks(backup.tasks, session.userId);

    for (const [date, logs] of Object.entries(backup.logs)) {
      await saveDailyLog(date, logs, session.userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Backup imported successfully',
    });

  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}