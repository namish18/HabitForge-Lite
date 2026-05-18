'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/store/appStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'Dashboard', id: 'nav-dashboard' },
  { href: '/categories', icon: '📂', label: 'Categories', id: 'nav-categories' },
  { href: '/tasks', icon: '✅', label: 'Tasks', id: 'nav-tasks' },
  { href: '/timer', icon: '⏱️', label: 'Timer', id: 'nav-timer' },
  { href: '/logs', icon: '📋', label: 'Daily Logs', id: 'nav-logs' },
  { href: '/analytics', icon: '📊', label: 'Analytics', id: 'nav-analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={toggleSidebar} aria-hidden="true" />
      )}
      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={toggleSidebar}
        aria-label="Open menu"
        id="mobile-menu-btn"
      >
        ☰
      </button>
    <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          {sidebarOpen && (
            <div className={styles.logoTextWrap}>
              <span className={styles.logoText}>HabitForge</span>
              <span className={styles.logoBadge}>Lite</span>
            </div>
          )}
        </div>
        <button
          className={styles.toggleBtn}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          id="sidebar-toggle"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
              {isActive && <span className={styles.activeDot} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <button
          id="logout-btn"
          className={styles.logoutBtn}
          onClick={handleLogout}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <span>🚪</span>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
