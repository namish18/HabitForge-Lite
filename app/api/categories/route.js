import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCategories, saveCategories } from '@/lib/storage';

async function authenticate() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session;
}

/**
 * GET /api/categories
 * Returns the encrypted payload stored in GitHub.
 * Returns null when the file does not exist yet (new user).
 * The browser decrypts this payload — the server never sees plaintext.
 */
export async function GET() {
  try {
    const session = await authenticate();
    const payload = await getCategories(session.userId);
    return NextResponse.json(payload);   // null or EncryptedPayload
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Accepts a pre-encrypted payload from the browser and writes it to storage.
 * Body: { encryptedPayload: { version, algorithm, salt, iv, ciphertext } }
 * The server validates the payload shape but never decrypts it.
 */
export async function POST(request) {
  try {
    const session = await authenticate();
    const { encryptedPayload } = await request.json();

    if (
      !encryptedPayload ||
      encryptedPayload.version !== 1 ||
      encryptedPayload.algorithm !== 'AES-256-GCM' ||
      typeof encryptedPayload.salt !== 'string' ||
      typeof encryptedPayload.iv !== 'string' ||
      typeof encryptedPayload.ciphertext !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 });
    }

    await saveCategories(encryptedPayload, session.userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
