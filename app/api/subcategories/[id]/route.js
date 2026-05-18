import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubcategories, saveSubcategories, getTasks, saveTasks } from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
}

export async function PUT(request, { params }) {
  try {
    await authenticate();
    const { id } = await params;
    const { name, categoryId } = await request.json();

    const subcategories = await getSubcategories();
    const index = subcategories.findIndex((s) => s.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    subcategories[index] = {
      ...subcategories[index],
      ...(name && { name: name.trim() }),
      ...(categoryId && { categoryId }),
    };

    await saveSubcategories(subcategories);
    return NextResponse.json(subcategories[index]);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await authenticate();
    const { id } = await params;

    const [subcategories, tasks] = await Promise.all([getSubcategories(), getTasks()]);
    const filteredSubs = subcategories.filter((s) => s.id !== id);
    const filteredTasks = tasks.filter((t) => t.subcategoryId !== id);

    await Promise.all([saveSubcategories(filteredSubs), saveTasks(filteredTasks)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
