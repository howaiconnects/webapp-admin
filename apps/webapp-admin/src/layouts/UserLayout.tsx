import type { Metadata } from 'next';
import React from 'react';
import '../../app/globals.css';
import UserNavigation from '../components/UserNavigation';
import { useTheme } from '../components/ThemeContext';
import { ChatProvider } from '../contexts/ChatProvider';
import ChatWidget from '../components/ChatWidget';

export const metadata: Metadata = {
  title: 'User Dashboard - HowAIConnects',
  description: 'User section of the unified dashboard for HowAIConnects',
};

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Existing layout content */}
      {children}
      
      {/* Persistent Chat Widget */}
      <ChatProvider initialRole="user">
        <ChatWidget onClose={() => {}} />  {/* No-op for persistent */}
      </ChatProvider>
    </div>
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserLayoutContent>{children}</UserLayoutContent>;
}