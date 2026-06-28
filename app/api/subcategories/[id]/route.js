import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubcategories, saveSubcategories, getTasks, saveTasks } from '@/lib/storage';

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
 * PUT /api/subcategories/[id]
 * Body: { encryptedPayload }
 */
export async function PUT(request, { params }) {
  try {
    const session = await authenticate();
    const { encryptedPayload } = await request.json();

    if (!validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await saveSubcategories(encryptedPayload, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/subcategories/[id]
 * Body: { encryptedSubcategories, encryptedTasks }
 * Browser has already filtered and re-encrypted both collections.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await authenticate();
    const { encryptedSubcategories, encryptedTasks } = await request.json();

    if (!validatePayload(encryptedSubcategories) || !validatePayload(encryptedTasks)) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await Promise.all([
      saveSubcategories(encryptedSubcategories, session.userId),
      saveTasks(encryptedTasks, session.userId),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
