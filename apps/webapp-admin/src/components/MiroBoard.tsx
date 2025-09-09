'use client';

import React, { useState, useEffect } from 'react';
import { MiroAdapter } from '../../../../packages/adapters/miro-adapter';

interface MiroBoardProps {
  boardUrl: string;
  width?: string;
  height?: string;
}

export default function MiroBoard({ boardUrl, width = '100%', height = '600px' }: MiroBoardProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadBoard = async () => {
      try {
        setLoading(true);
        setError('');

        const adapter = new MiroAdapter();
        await adapter.initBoard(boardUrl);
        const url = adapter.getEmbedUrl();
        setEmbedUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Miro board');
      } finally {
        setLoading(false);
      }
    };

    if (boardUrl) {
      loadBoard();
    }
  }, [boardUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width, height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Miro board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-4" style={{ width, height }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-700 font-medium">Error loading Miro board</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4" style={{ width, height }}>
        <p className="text-gray-600">No board URL provided</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ width, height }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title="Miro Board"
        className="w-full h-full"
      />
    </div>
  );
}
