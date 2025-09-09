'use client';

import React from 'react';

interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function DashboardWidget({ title, children, className = '' }: DashboardWidgetProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-primary-light">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}