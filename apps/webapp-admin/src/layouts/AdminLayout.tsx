import type { Metadata } from 'next';
import React from 'react';
import '../../app/globals.css';
import AdminNavigation from '../components/AdminNavigation';
import { useTheme } from '../components/ThemeContext';
import { ChatProvider } from '../contexts/ChatProvider';
import ChatWidget from '../components/ChatWidget';

export const metadata: Metadata = {
  title: 'Admin Dashboard - HowAIConnects',
  description: 'Admin section of the unified dashboard for HowAIConnects',
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      <AdminNavigation />
      <main className="main-content">
        {children}
        
        {/* Persistent Chat Widget */}
        <ChatProvider initialRole="admin">
          <ChatWidget onClose={() => {}} />  {/* No-op for persistent */}
        </ChatProvider>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}