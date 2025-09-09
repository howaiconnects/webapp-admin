import Breadcrumb from '../../../src/components/Breadcrumb';
import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' }
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary-light">
          Admin Dashboard
        </h1>
        <p className="text-lg text-secondary-light">
          Professional dark theme with structured sidebar navigation
        </p>
      </div>

      {/* Metrics Cards */}
      <section className="mb-8" aria-label="Dashboard metrics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group relative" role="article" aria-label="Total Leads metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">1,234</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-white text-xl"></i>
              </div>
            </div>
            <a href="/admin/crm" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="View leads details">View Details →</a>
            <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 -top-10 left-0 z-10" role="tooltip" aria-hidden="true">
              Number of leads from Airtable CRM
            </div>
          </div>

          {/* Active AI Sessions Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group relative" role="article" aria-label="Active AI Sessions metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active AI Sessions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">567</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="ri-play-circle-line text-white text-xl"></i>
              </div>
            </div>
            <a href="/admin/ai" className="mt-3 inline-block text-green-600 text-sm font-medium hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" aria-label="View AI sessions details">View Details →</a>
            <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 -top-10 left-0 z-10" role="tooltip" aria-hidden="true">
              Current concurrent AI prompt sessions
            </div>
          </div>

          {/* Recent Prompts Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group relative" role="article" aria-label="Recent Prompts metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Recent Prompts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">89</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="ri-chat-3-line text-white text-xl"></i>
              </div>
            </div>
            <a href="/admin/ai" className="mt-3 inline-block text-purple-600 text-sm font-medium hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" aria-label="View recent prompts details">View Details →</a>
            <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 -top-10 left-0 z-10" role="tooltip" aria-hidden="true">
              Prompts executed in the last 24 hours
            </div>
          </div>

          {/* System Health Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group relative" role="article" aria-label="System Health metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">System Health</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">98%</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <i className="ri-health-book-line text-white text-xl"></i>
              </div>
            </div>
            <a href="/admin/settings" className="mt-3 inline-block text-orange-600 text-sm font-medium hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2" aria-label="View system health details">View Details →</a>
            <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 -top-10 left-0 z-10" role="tooltip" aria-hidden="true">
              Overall system uptime and performance
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8" aria-label="Quick actions">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex flex-col items-center" 
            aria-label="New AI Prompt"
            onClick={() => window.location.href = '/admin/ai'}
          >
            <i className="ri-add-circle-line text-xl mb-2"></i>
            <span className="font-medium text-sm">New AI Prompt</span>
          </button>
          <button 
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex flex-col items-center" 
            aria-label="View CRM Data"
            onClick={() => window.location.href = '/admin/crm'}
          >
            <i className="ri-database-line text-xl mb-2"></i>
            <span className="font-medium text-sm">View CRM Data</span>
          </button>
          <button 
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 flex flex-col items-center" 
            aria-label="Open Whiteboard"
            onClick={() => window.location.href = '/admin/ai'}
          >
            <i className="ri-edit-box-line text-xl mb-2"></i>
            <span className="font-medium text-sm">Open Whiteboard</span>
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4" role="listitem" aria-label="New user registration activity">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-gray-900">New user registration</p>
                <p className="text-gray-500 text-sm">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4" role="listitem" aria-label="System backup completed activity">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-gray-900">System backup completed</p>
                <p className="text-gray-500 text-sm">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4" role="listitem" aria-label="Security scan in progress activity">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-gray-900">Security scan in progress</p>
                <p className="text-gray-500 text-sm">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
