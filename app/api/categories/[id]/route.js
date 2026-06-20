import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, saveCategories, getSubcategories, saveSubcategories, getTasks, saveTasks } from '@/lib/storage';

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
    const { name, color, icon } = body;

    const categories = await getCategories(session.userId);
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    categories[index] = {
      ...categories[index],
      ...(name && { name: name.trim() }),
      ...(color && { color }),
      ...(icon && { icon }),
    };

    await saveCategories(categories, session.userId);
    return NextResponse.json(categories[index]);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await authenticate();
    const { id } = await params;

    const [categories, subcategories, tasks] = await Promise.all([
      getCategories(session.userId),
      getSubcategories(session.userId),
      getTasks(session.userId),
    ]);

    const subIds = subcategories.filter((s) => s.categoryId === id).map((s) => s.id);
    const filteredSubs = subcategories.filter((s) => s.categoryId !== id);
    const filteredTasks = tasks.filter((t) => !subIds.includes(t.subcategoryId));
    const filteredCats = categories.filter((c) => c.id !== id);

    await Promise.all([
      saveCategories(filteredCats, session.userId),
      saveSubcategories(filteredSubs, session.userId),
      saveTasks(filteredTasks, session.userId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
