import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubcategories, saveSubcategories } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

export async function GET() {
  try {
    const session = await authenticate();
    const subcategories = await getSubcategories(session.userId);
    return NextResponse.json(subcategories);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await authenticate();
    const { name, categoryId } = await request.json();

    if (!name?.trim() || !categoryId) {
      return NextResponse.json({ error: 'Name and categoryId are required' }, { status: 400 });
    }

    const subcategories = await getSubcategories(session.userId);
    const newSub = {
      id: uuidv4(),
      categoryId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    subcategories.push(newSub);
    await saveSubcategories(subcategories, session.userId);
    return NextResponse.json(newSub, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
