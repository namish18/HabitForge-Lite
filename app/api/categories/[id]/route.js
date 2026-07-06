import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, saveCategories, getSubcategories, saveSubcategories, getTasks, saveTasks } from '@/lib/storage';

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
 * PUT /api/categories/[id]
 * Accepts pre-encrypted updated-categories payload from the browser.
 * Body: { encryptedPayload }
 */
export async function PUT(request, { params }) {
  try {
    const session = await authenticate();
    const { encryptedPayload } = await request.json();

    if (!validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await saveCategories(encryptedPayload, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/categories/[id]
 * Accepts pre-encrypted payloads for all three affected collections.
 * Body: {
 *   encryptedCategories,
 *   encryptedSubcategories,
 *   encryptedTasks
 * }
 * The browser has already decrypted, filtered, and re-encrypted each collection.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await authenticate();
    const { encryptedCategories, encryptedSubcategories, encryptedTasks } = await request.json();

    if (
      !validatePayload(encryptedCategories) ||
      !validatePayload(encryptedSubcategories) ||
      !validatePayload(encryptedTasks)
    ) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await Promise.all([
      saveCategories(encryptedCategories, session.userId),
      saveSubcategories(encryptedSubcategories, session.userId),
      saveTasks(encryptedTasks, session.userId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
