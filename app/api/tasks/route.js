import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTasks, saveTasks } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

async function authenticate() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
}

export async function GET() {
  try {
    await authenticate();
    const tasks = await getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await authenticate();
    const body = await request.json();
    const { subcategoryId, title, description, targetMinutes, priority } = body;

    if (!title?.trim() || !subcategoryId) {
      return NextResponse.json({ error: 'Title and subcategoryId are required' }, { status: 400 });
    }

    const tasks = await getTasks();
    const newTask = {
      id: uuidv4(),
      subcategoryId,
      title: title.trim(),
      description: description?.trim() || '',
      targetMinutes: parseInt(targetMinutes) || 60,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    await saveTasks(tasks);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
