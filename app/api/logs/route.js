import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDailyLog, saveDailyLog, getLogDates } from '@/lib/storage';
import { format } from 'date-fns';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

function validatePayload(payload) {
  return (
    payload &&
    payload.version === 1 &&
    payload.algorithm === 'AES-256-GCM' &&
    typeof payload.salt === 'string' &&
    typeof payload.iv === 'string' &&
    typeof payload.ciphertext === 'string'
  );
}

/**
 * GET /api/logs?date=YYYY-MM-DD
 * Returns the encrypted daily log payload from GitHub.
 * Returns null when no log file exists for that date.
 * The browser decrypts it — the server never sees plaintext.
 *
 * GET /api/logs?dates=true
 * Returns a list of date strings for which log files exist (for analytics).
 */
export async function GET(request) {
  try {
    const session = await authenticate();
    const { searchParams } = new URL(request.url);

    // Special: return list of log dates so the browser can fetch each one for analytics
    if (searchParams.get('dates') === 'true') {
      const dates = await getLogDates(session.userId, 90);
      return NextResponse.json(dates);
    }

    const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
    const payload = await getDailyLog(date, session.userId);
    return NextResponse.json(payload);   // null or EncryptedPayload
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/logs
 * Accepts a pre-encrypted daily log payload and writes it.
 * Body: { date: 'YYYY-MM-DD', encryptedPayload }
 */
export async function POST(request) {
  try {
    const session = await authenticate();
    const { date, encryptedPayload } = await request.json();

    if (!date || !validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'date and a valid encryptedPayload are required' }, { status: 400 });
    }

    await saveDailyLog(date, encryptedPayload, session.userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/logs  (update / toggle an entry)
 * Body: { date: 'YYYY-MM-DD', encryptedPayload }
 */
export async function PUT(request) {
  try {
    const session = await authenticate();
    const { date, encryptedPayload } = await request.json();

    if (!date || !validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'date and a valid encryptedPayload are required' }, { status: 400 });
    }

    await saveDailyLog(date, encryptedPayload, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/logs
 * Body: { date: 'YYYY-MM-DD', encryptedPayload }
 * Browser has already removed the entry and re-encrypted the remaining log.
 */
export async function DELETE(request) {
  try {
    const session = await authenticate();
    const { date, encryptedPayload } = await request.json();

    if (!date || !validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'date and a valid encryptedPayload are required' }, { status: 400 });
    }

    await saveDailyLog(date, encryptedPayload, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
