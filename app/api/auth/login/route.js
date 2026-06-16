import { NextResponse } from 'next/server';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import argon2 from 'argon2';
import { getRegistry } from '@/lib/users';

const INVALID_CREDENTIALS = { error: 'Invalid username or password' };

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const registry = await getRegistry();

    const user = registry.find(
      (u) => u.username === username
    );

    if (!user) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    const valid = await argon2.verify(
      user.passwordHash,
      password
    );

    if (!valid) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    const token = await signToken({
      userId: user.userId,
      username: user.username,
      authenticated: true,
      createdAt: user.createdAt,
    });

    const response = NextResponse.json({ success: true, message: 'Login successful' });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
