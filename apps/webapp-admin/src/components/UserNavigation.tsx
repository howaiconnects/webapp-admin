import React from 'react';
import ThemeToggle from './ThemeToggle';

export default function UserNavigation() {
  return (
    <nav className="navbar-header">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-primary-light">HowAIConnects</h1>
        </div>

        <div className="flex items-center space-x-6">
          <a href="/user/dashboard" className="text-secondary-light hover:text-primary-600 transition-colors">
            Dashboard
          </a>
          <a href="/user/profile" className="text-secondary-light hover:text-primary-600 transition-colors">
            Profile
          </a>
          <a href="/user/settings" className="text-secondary-light hover:text-primary-600 transition-colors">
            Settings
          </a>
          <ThemeToggle />
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}