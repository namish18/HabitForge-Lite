import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

import {
  getRegistry,
  saveRegistry,
  findUserByUsername,
} from '@/lib/users';

import { writeFile } from '@/lib/github';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must contain only alphanumeric characters' },
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

    const exists = await findUserByUsername(username);

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
      username,
      passwordHash,
      createdAt: Date.now(),
    });

    await saveRegistry(registry);

    // Create starter files
    await writeFile(
      `data/users/${userId}/tasks.json`,
      [],
      'Initialize tasks'
    );

    await writeFile(
      `data/users/${userId}/categories.json`,
      [],
      'Initialize categories'
    );

    await writeFile(
      `data/users/${userId}/subcategories.json`,
      [],
      'Initialize subcategories'
    );

    await writeFile(
      `data/users/${userId}/profile.json`,
      {
        userId,
        username,
      },
      'Initialize profile'
    );

    return NextResponse.json({
      success: true,
      userId,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}