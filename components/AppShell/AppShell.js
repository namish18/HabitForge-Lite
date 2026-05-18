'use client';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Navbar from '@/components/Navbar/Navbar';
import { useAppStore } from '@/store/appStore';

export default function AppShell({ children }) {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // On mobile, start with sidebar closed
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768 && sidebarOpen) {
        // close it — but only once on initial mount
      }
    }
    // Close sidebar by default on small screens on first mount
    if (typeof window !== 'undefined' && window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Navbar />
        {children}
      </div>
    </div>
  );
}
