import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

import {
  getRegistry,
  saveRegistry,
  findUserByUsername,
} from '@/lib/users';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?])/;

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Strip any whitespace that may have slipped through the client
    const cleanUsername = username.replace(/\s/g, '');

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (/\s/.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Username must not contain spaces' },
        { status: 400 }
      );
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number and one special character' },
        { status: 400 }
      );
    }

    const exists = await findUserByUsername(cleanUsername);

    if (exists) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const userId = uuidv4();
    const passwordHash = await argon2.hash(password);

    const registry = await getRegistry();
    registry.push({
      userId,
      username: cleanUsername,
      passwordHash,
      createdAt: Date.now(),
    });
    await saveRegistry(registry);

    // NOTE: No initial data files are written here.
    // The server cannot write encrypted files because it has no access to the
    // user's encryption key (which is derived browser-side from the password).
    // Data files are created lazily the first time the user writes data after
    // logging in.  GET routes return null for missing files, which the browser
    // treats as an empty collection.

    return NextResponse.json({ success: true, userId });

  } catch (error) {
    console.error('Registration error:', error.message);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}