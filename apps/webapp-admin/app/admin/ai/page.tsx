'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../src/components/Breadcrumb';

export default function AIDashboard() {
  const [inputValue, setInputValue] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const boardUrl = process.env.NEXT_PUBLIC_MIRO_BOARD_URL || '';
  const [embedUrl, setEmbedUrl] = useState('');

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setError('');
    setResponse('');
    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputValue }),
      });
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      const data = await res.json();
      setResponse(data.response || data.content || 'No response received from AI.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Miro embed URL by parsing board URL
  useEffect(() => {
    if (boardUrl) {
      try {
        const boardIdMatch = boardUrl.match(/\/board\/([a-zA-Z0-9_-]+)/);
        if (!boardIdMatch) {
          throw new Error('Invalid Miro board URL format');
        }
        const boardId = boardIdMatch[1];
        setEmbedUrl(`https://miro.com/app/embed/${boardId}/`);
      } catch (err) {
        console.error('Failed to generate Miro embed URL:', err);
        setError('Failed to load Miro board. Check the board URL format.');
      }
    }
  }, [boardUrl]);

  return (
    <div className="p-8 min-h-screen bg-background">
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'AI' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary-light">
          Admin AI Integration
        </h1>
        <p className="text-lg text-secondary-light">
          Interact with AI prompts on the left and view the Miro whiteboard on the right.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel: AI Prompt Panel */}
        <section className="flex-1 lg:w-1/2" aria-labelledby="ai-panel-title">
          <div className="bg-white dark:bg-dark-1 rounded-lg shadow-md p-6 h-full flex flex-col">
            <h2 id="ai-panel-title" className="text-xl font-semibold mb-4 text-primary-light">AI Prompt Panel</h2>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your free-form prompt here..."
              className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 transition-colors"
              rows={4}
              disabled={isLoading}
              aria-label="AI prompt input"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors mb-4 self-start flex items-center"
              aria-label="Run the AI prompt"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running...
                </>
              ) : (
                'Run Prompt'
              )}
            </button>
            {error && (
              <div role="alert" aria-live="assertive" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4">
                Error: {error}
              </div>
            )}
            {response && (
              <article className="bg-neutral-50 dark:bg-dark-3 p-4 rounded-md flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold mb-2 text-primary-light">AI Response:</h3>
                <pre className="text-sm text-secondary-light whitespace-pre-wrap">{response}</pre>
              </article>
            )}
          </div>
        </section>

        {/* Right Panel: Miro Whiteboard Embed */}
        <section className="flex-1 lg:w-1/2" aria-labelledby="miro-panel-title">
          <div className="bg-white dark:bg-dark-1 rounded-lg shadow-md p-6 h-full flex flex-col">
            <h2 id="miro-panel-title" className="text-xl font-semibold mb-4 text-primary-light">Miro Whiteboard</h2>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                sandbox="allow-scripts allow-same-origin"
                className="border-0 rounded-md flex-1"
                title="Miro Whiteboard Embed"
                loading="lazy"
                aria-label="Embedded Miro whiteboard"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-secondary-light dark:text-neutral-400 text-center p-4 rounded-md bg-neutral-50 dark:bg-dark-3">
                Miro board not available. Ensure <code>NEXT_PUBLIC_MIRO_BOARD_URL</code> is set in your environment variables with a valid Miro board URL (e.g., https://miro.com/app/board/abc123/).
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
