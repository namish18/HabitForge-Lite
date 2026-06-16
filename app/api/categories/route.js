import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, saveCategories } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

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
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await authenticate();
    const body = await request.json();
    const { name, color, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const categories = await getCategories(session.userId);
    const newCategory = {
      id: uuidv4(),
      name: name.trim(),
      color: color || '#febfca',
      icon: icon || '📁',
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    await saveCategories(categories, session.userId);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
