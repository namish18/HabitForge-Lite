import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, getSubcategories, getTasks, getDailyLog, getLogDates } from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

/**
 * GET /api/analytics
 * Returns all raw encrypted payloads so the browser can decrypt and compute
 * analytics client-side.  The server cannot compute analytics because it
 * cannot decrypt the data.
 *
 * Response:
 * {
 *   categories:    EncryptedPayload | null,
 *   subcategories: EncryptedPayload | null,
 *   tasks:         EncryptedPayload | null,
 *   logs: {
 *     [date]: EncryptedPayload | null,
 *     ...
 *   }
 * }
 */
export async function GET(request) {
  try {
    const session = await authenticate();

    // Fetch the list of log dates, then fetch each encrypted log blob in parallel
    const [categoriesPayload, subcategoriesPayload, tasksPayload, logDates] = await Promise.all([
      getCategories(session.userId),
      getSubcategories(session.userId),
      getTasks(session.userId),
      getLogDates(session.userId, 90),
    ]);

    const logEntries = await Promise.all(
      logDates.map(async (date) => {
        const payload = await getDailyLog(date, session.userId);
        return [date, payload];
      })
    );

    const logs = Object.fromEntries(logEntries);

    return NextResponse.json({
      categories:    categoriesPayload,
      subcategories: subcategoriesPayload,
      tasks:         tasksPayload,
      logs,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
