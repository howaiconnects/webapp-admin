"use client";

import { useState, useRef, useEffect } from 'react';

interface ApiResponse {
  reply: string;
}

type Message = {
  role: 'user' | 'ai';
  content: string;
  isError?: boolean;
};

export default function ChatPage() {
  const [history, setHistory] = useState<Message[]>([{ role: 'ai' as const, content: 'Hello! How can I help you today?' }]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [lastHistoryBeforeSend, setLastHistoryBeforeSend] = useState<Message[]>([]);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [history]);

  const sendMessage = async (userMessage: string, historyBeforeSend: Message[], isRetry = false) => {
    if (isLoading) return;

    setIsLoading(true);

    if (!isRetry) {
      setMessage('');
      setLastFailedMessage(null);
      setLastHistoryBeforeSend(historyBeforeSend);
      const userMessageObj: Message = { role: 'user', content: userMessage };
      const newHistory: Message[] = [...historyBeforeSend, userMessageObj];
      setHistory(newHistory);
    }

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: historyBeforeSend }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: ApiResponse = await response.json();
      const aiMessage: Message = { role: 'ai', content: data.reply };
      setHistory(prevHistory => [...prevHistory, aiMessage]);
    } catch (error) {
      const errorMsg: Message = { role: 'ai', content: 'Sorry, an error occurred. Please retry your message.', isError: true };
      setHistory(prevHistory => [...prevHistory, errorMsg]);
      if (!isRetry) {
        setLastFailedMessage(userMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    if (!lastFailedMessage || lastHistoryBeforeSend.length === 0 || !history[history.length - 1]?.isError) return;

    // Remove the error message
    const historyWithoutError: Message[] = history.slice(0, -1);
    setHistory(historyWithoutError);
    // The user message is already in historyWithoutError, so send with the history before the user message? Wait, no - for retry, we need to resend the last user message with the history before it.
    // Actually, since we removed only the error, the last is the user message, so historyBeforeSend for retry is historyWithoutError.slice(0, -1)
    const historyBeforeRetrySend = historyWithoutError.slice(0, -1);
    await sendMessage(lastFailedMessage, historyBeforeRetrySend, true);
  };

  const clearChat = () => {
    setHistory([{ role: 'ai' as const, content: 'Hello! How can I help you today?' }]);
    setLastFailedMessage(null);
    setLastHistoryBeforeSend([]);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full p-4 md:p-6">
      <header className="flex justify-between items-center mb-4 pb-4 border-b">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <button
          onClick={clearChat}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="Clear chat history"
        >
          Clear Chat
        </button>
      </header>

      <div
        ref={conversationRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white ml-4'
                  : 'bg-gray-200 text-gray-900 mr-4'
              }`}
            >
              <p>{msg.content}</p>
              {msg.isError && (
                <button
                  onClick={retryLastMessage}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Retry sending message"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg bg-gray-200 mr-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-48"
          aria-label="Message templates"
        >
          <option>No template</option>
          <option>Quick question</option>
          <option>Technical help</option>
        </select>
        <div className="flex flex-1 space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(message, history);
              }
            }}
            className="flex-1 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            rows={3}
            placeholder="Type your message here..."
            aria-label="Type your message"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(message, history)}
            disabled={isLoading || !message.trim()}
            className="px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
            aria-label="Send message"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
