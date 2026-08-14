import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getProfile,
  getCategories,
  getSubcategories,
  getTasks,
  getAllLogs,
} from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

export async function GET() {
  try {
    const session = await authenticate();

    const [
      profile,
      categories,
      subcategories,
      tasks,
      logs,
    ] = await Promise.all([
      getProfile(session.userId),
      getCategories(session.userId),
      getSubcategories(session.userId),
      getTasks(session.userId),
      getAllLogs(session.userId),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      categories,
      subcategories,
      tasks,
      logs,
    };

    return new Response(
      JSON.stringify(backup, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="habitforge-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
        },
      }
    );

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