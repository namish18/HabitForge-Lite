import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, saveCategories, getSubcategories, saveSubcategories, getTasks, saveTasks } from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
}

export async function PUT(request, { params }) {
  try {
    await authenticate();
    const { id } = await params;
    const body = await request.json();
    const { name, color, icon } = body;

    const categories = await getCategories();
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

    await saveCategories(categories);
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
    await authenticate();
    const { id } = await params;

    const [categories, subcategories, tasks] = await Promise.all([
      getCategories(),
      getSubcategories(),
      getTasks(),
    ]);

    const subIds = subcategories.filter((s) => s.categoryId === id).map((s) => s.id);
    const filteredSubs = subcategories.filter((s) => s.categoryId !== id);
    const filteredTasks = tasks.filter((t) => !subIds.includes(t.subcategoryId));
    const filteredCats = categories.filter((c) => c.id !== id);

    await Promise.all([
      saveCategories(filteredCats),
      saveSubcategories(filteredSubs),
      saveTasks(filteredTasks),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
