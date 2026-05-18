'use client';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import styles from './Navbar.module.css';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', icon: '🏠' },
  '/categories': { title: 'Categories', icon: '📂' },
  '/tasks': { title: 'Tasks', icon: '✅' },
  '/timer': { title: 'Timer', icon: '⏱️' },
  '/logs': { title: 'Daily Logs', icon: '📋' },
  '/analytics': { title: 'Analytics', icon: '📊' },
};

function getPageInfo(pathname) {
  if (pathname === '/') return PAGE_TITLES['/'];
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (key !== '/' && pathname.startsWith(key)) return val;
  }
  return { title: 'HabitForge Lite', icon: '⚡' };
}

export default function Navbar() {
  const pathname = usePathname();
  const { sidebarOpen, timer } = useAppStore();
  const pageInfo = getPageInfo(pathname);
  const now = new Date();

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header
      className={`${styles.navbar} ${!sidebarOpen ? styles.collapsed : ''}`}
    >
      <div className={styles.left}>
        <span className={styles.pageIcon}>{pageInfo.icon}</span>
        <h1 className={styles.pageTitle}>{pageInfo.title}</h1>
      </div>
      <div className={styles.right}>
        {(timer.isRunning || timer.isPaused) && (
          <div className={styles.timerPill}>
            <span className={`${styles.timerDot} ${timer.isRunning ? styles.running : styles.paused}`} />
            <span>{formatTime(timer.elapsed)}</span>
          </div>
        )}
        <div className={styles.date}>{dateStr}</div>
        <div className={styles.avatar}>
          <span>👤</span>
        </div>
      </div>
    </header>
  );
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
