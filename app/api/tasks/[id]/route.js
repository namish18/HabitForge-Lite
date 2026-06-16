import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTasks, saveTasks } from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

export async function PUT(request, { params }) {
  try {
    const session = await authenticate();
    const { id } = await params;
    const body = await request.json();

    const tasks = await getTasks(session.userId);
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    tasks[index] = {
      ...tasks[index],
      ...(body.title && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.targetMinutes && { targetMinutes: parseInt(body.targetMinutes) }),
      ...(body.priority && { priority: body.priority }),
      ...(body.subcategoryId && { subcategoryId: body.subcategoryId }),
    };

    await saveTasks(tasks, session.userId);
    return NextResponse.json(tasks[index]);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await authenticate();
    const { id } = await params;
    const tasks = await getTasks(session.userId);
    const filtered = tasks.filter((t) => t.id !== id);
    await saveTasks(filtered, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
