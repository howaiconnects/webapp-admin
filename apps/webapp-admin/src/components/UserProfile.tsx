'use client';

import React, { useState, useEffect } from 'react';

export default function UserProfile() {
  const [boardUrl, setBoardUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved board URL from localStorage
    const savedUrl = localStorage.getItem('miroBoardUrl');
    if (savedUrl) {
      setBoardUrl(savedUrl);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('miroBoardUrl', boardUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBoardUrl(e.target.value);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="boardUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Miro Board URL
          </label>
          <input
            type="url"
            id="boardUrl"
            value={boardUrl}
            onChange={handleUrlChange}
            placeholder="https://miro.com/app/board/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the URL of your Miro board to embed it in your dashboard
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            disabled={!boardUrl.trim()}
          >
            Save Settings
          </button>

          {saved && (
            <span className="text-green-600 font-medium">
              Settings saved successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Added console.debug to validate parse fix
console.debug('apps/webapp-admin/src/components/UserProfile.tsx parse fix applied')