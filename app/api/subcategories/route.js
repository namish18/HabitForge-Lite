import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubcategories, saveSubcategories } from '@/lib/storage';

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
 * GET /api/subcategories
 * Returns the encrypted payload from GitHub.
 * The browser decrypts it — the server never sees plaintext.
 */
export async function GET() {
  try {
    const session = await authenticate();
    const payload = await getSubcategories(session.userId);
    return NextResponse.json(payload);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/subcategories
 * Accepts a pre-encrypted full subcategories payload from the browser.
 */
export async function POST(request) {
  try {
    const session = await authenticate();
    const { encryptedPayload } = await request.json();

    if (!validatePayload(encryptedPayload)) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await saveSubcategories(encryptedPayload, session.userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
