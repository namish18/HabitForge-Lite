import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubcategories, saveSubcategories } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

async function authenticate() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
}

export async function GET() {
  try {
    await authenticate();
    const subcategories = await getSubcategories();
    return NextResponse.json(subcategories);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await authenticate();
    const { name, categoryId } = await request.json();

    if (!name?.trim() || !categoryId) {
      return NextResponse.json({ error: 'Name and categoryId are required' }, { status: 400 });
    }

    const subcategories = await getSubcategories();
    const newSub = {
      id: uuidv4(),
      categoryId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    subcategories.push(newSub);
    await saveSubcategories(subcategories);
    return NextResponse.json(newSub, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
