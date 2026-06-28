import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTasks, saveTasks } from '@/lib/storage';

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
 * PUT /api/tasks/[id]
 * Body: { encryptedPayload }
 */
export async function PUT(request, { params }) {
  try {
    const session = await authenticate();
    const { encryptedPayload } = await request.json();

    if (!validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await saveTasks(encryptedPayload, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]
 * Body: { encryptedPayload }
 */
export async function DELETE(request, { params }) {
  try {
    const session = await authenticate();
    const { encryptedPayload } = await request.json();

    if (!validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await saveTasks(encryptedPayload, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
