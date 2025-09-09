import React, { useState } from 'react';

export default function AdminHeader() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="bg-dark-1 border-b border-neutral-700 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setNotificationsOpen(!notificationsOpen)} 
          className="relative p-2 text-white hover:text-primary-400"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
        >
          <i className="ri-notification-line text-xl"></i>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-dark-2 border border-neutral-700 rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-white">Notifications</h3>
                <ul className="mt-2 space-y-2">
                  <li className="text-sm text-secondary-light">New lead added</li>
                  <li className="text-sm text-secondary-light">AI prompt executed</li>
                </ul>
              </div>
            </div>
          )}
        </button>
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)} 
            className="flex items-center space-x-2 p-2 text-white hover:text-primary-400"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <i className="ri-user-line text-xl"></i>
            <span className="text-sm">Admin User</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-2 border border-neutral-700 rounded-lg shadow-lg z-50">
              <ul className="py-1">
                <li>
                  <a href="/admin/profile" className="block px-4 py-2 text-sm text-secondary-light hover:bg-neutral-700">Profile</a>
                </li>
                <li>
                  <a href="/admin/settings" className="block px-4 py-2 text-sm text-secondary-light hover:bg-neutral-700">Settings</a>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-secondary-light hover:bg-neutral-700">Sign Out</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}