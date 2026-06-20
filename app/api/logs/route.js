import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDailyLog, upsertLogEntry, deleteLogEntry } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
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
    const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
    const logs = await getDailyLog(date, session.userId);
    return NextResponse.json(logs);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await authenticate();
    const body = await request.json();
    const { taskId, date, minutesSpent, completed, notes } = body;

    if (!taskId || !date) {
      return NextResponse.json({ error: 'taskId and date are required' }, { status: 400 });
    }

    const entry = {
      id: uuidv4(),
      taskId,
      date,
      minutesSpent: parseInt(minutesSpent) || 0,
      completed: Boolean(completed),
      notes: notes || '',
    };

    await upsertLogEntry(date, entry, session.userId);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await authenticate();
    const body = await request.json();
    const { id, date, ...updates } = body;

    if (!id || !date) {
      return NextResponse.json({ error: 'id and date are required' }, { status: 400 });
    }

    const entry = { id, date, ...updates };
    const logs = await upsertLogEntry(date, entry, session.userId);
    const updated = logs.find((l) => l.id === id);
    return NextResponse.json(updated);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await authenticate();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');

    if (!id || !date) {
      return NextResponse.json({ error: 'id and date are required' }, { status: 400 });
    }

    await deleteLogEntry(date, id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
