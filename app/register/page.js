'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ ADDED: password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValid =
    /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password) &&
    password.length >= 8;

  const usernameValid =
    /^[a-zA-Z0-9]+$/.test(username) && username.length >= 3;

  const passwordsMatch =
    password === confirmPassword && password.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!usernameValid) {
      toast.error('Username must be 3+ characters, alphanumeric only');
      return;
    }

    if (!passwordValid) {
      toast.error(
        'Password must be 8+ characters with at least 1 number and 1 special character'
      );
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Account created! Please log in.');
        router.push('/login');
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>HabitForge Lite</span>
        </div>

        <h1 className={styles.title}>Get started</h1>
        <p className={styles.subtitle}>
          Create your account to begin building habits
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Choose a username (3+ characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
            {username && !usernameValid && (
              <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                Username must be 3+ chars, alphanumeric only
              </p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Password (8+ chars, 1 number, 1 special char)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {password && !passwordValid && (
              <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                Password needs 8+ chars, 1 number, and 1 special character
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="form-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {confirmPassword && !passwordsMatch && (
              <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-btn"
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
            disabled={
              loading || !usernameValid || !passwordValid || !passwordsMatch
            }
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                Creating account...
              </>
            ) : (
              <>
                <span>✨</span>
                Sign up
              </>
            )}
          </button>
        </form>

        <p className={styles.hint}>
          Already have an account?{' '}
          <Link href="/login" className={styles.link}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}