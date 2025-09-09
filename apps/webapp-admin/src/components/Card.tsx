import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Card({ title, children, className = '', headerAction, footer }: CardProps) {
  return (
    <div className={`bg-white dark:bg-dark-2 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm ${className}`}>
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-semibold text-primary-light dark:text-white">
              {title}
            </h3>
          )}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-dark-3">
          {footer}
        </div>
      )}
    </div>
  );
}