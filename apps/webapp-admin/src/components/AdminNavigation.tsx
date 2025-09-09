import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function AdminNavigation() {
  const [openSections, setOpenSections] = useState({
    main: true,
    powerUser: true,
    management: true
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSection = (section: 'main' | 'powerUser' | 'management') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <aside 
        className={`sidebar fixed inset-y-0 left-0 z-50 w-64 bg-dark-1 text-white transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`} 
        role="navigation" 
        aria-label="Admin navigation"
      >
        <div className="sidebar-logo p-4 border-b border-neutral-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold">HowAIConnects</h1>
          <div className="flex items-center space-x-2 lg:hidden">
            <ThemeToggle />
            <button onClick={toggleMobileMenu} className="p-1" aria-label="Close menu">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" role="menubar">
          <ul className="sidebar-menu space-y-2 px-3">
            {/* Main Section */}
            <li className="sidebar-menu-group">
              <button 
                onClick={() => toggleSection('main')} 
                className="sidebar-menu-group-title w-full text-left p-3 flex items-center justify-between rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={openSections.main}
                aria-controls="main-section"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('main'); }}
              >
                <span>Main</span>
                <i className={`ri-arrow-down-s-line transition-transform duration-200 ${openSections.main ? 'rotate-180' : ''}`}></i>
              </button>
              <ul id="main-section" className={`space-y-1 pl-4 ${openSections.main ? '' : 'hidden'}`} role="menu">
                <li role="menuitem">
                  <a href="/admin/dashboard" className="sidebar-link flex items-center p-2 rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active-page">
                    <i className="ri-dashboard-line mr-3"></i>
                    <span>Dashboard</span>
                  </a>
                </li>
              </ul>
            </li>

            {/* Power User Section */}
            <li className="sidebar-menu-group">
              <button 
                onClick={() => toggleSection('powerUser')} 
                className="sidebar-menu-group-title w-full text-left p-3 flex items-center justify-between rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={openSections.powerUser}
                aria-controls="power-user-section"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('powerUser'); }}
              >
                <span>Power User</span>
                <i className={`ri-arrow-down-s-line transition-transform duration-200 ${openSections.powerUser ? 'rotate-180' : ''}`}></i>
              </button>
              <ul id="power-user-section" className={`space-y-1 pl-4 ${openSections.powerUser ? '' : 'hidden'}`} role="menu">
                <li role="menuitem">
                  <a href="/admin/ai" className="sidebar-link flex items-center p-2 rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i className="ri-robot-line mr-3"></i>
                    <span>AI Dashboard</span>
                  </a>
                </li>
                <li role="menuitem">
                  <a href="/admin/crm" className="sidebar-link flex items-center p-2 rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i className="ri-user-line mr-3"></i>
                    <span>CRM Dashboard</span>
                  </a>
                </li>
              </ul>
            </li>

            {/* Management Section */}
            <li className="sidebar-menu-group">
              <button 
                onClick={() => toggleSection('management')} 
                className="sidebar-menu-group-title w-full text-left p-3 flex items-center justify-between rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={openSections.management}
                aria-controls="management-section"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('management'); }}
              >
                <span>Management</span>
                <i className={`ri-arrow-down-s-line transition-transform duration-200 ${openSections.management ? 'rotate-180' : ''}`}></i>
              </button>
              <ul id="management-section" className={`space-y-1 pl-4 ${openSections.management ? '' : 'hidden'}`} role="menu">
                <li role="menuitem">
                  <a href="/admin/analytics" className="sidebar-link flex items-center p-2 rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i className="ri-bar-chart-line mr-3"></i>
                    <span>Analytics</span>
                  </a>
                </li>
                <li role="menuitem">
                  <a href="/admin/reports" className="sidebar-link flex items-center p-2 rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i className="ri-file-text-line mr-3"></i>
                    <span>Reports</span>
                  </a>
                </li>
                <li role="menuitem">
                  <a href="/admin/ecommerce" className="sidebar-link flex items-center p-2 rounded hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i className="ri-shopping-cart-line mr-3"></i>
                    <span>eCommerce Dashboard</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={toggleMobileMenu}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
}
