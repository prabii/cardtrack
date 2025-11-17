import React, { useState, useEffect } from 'react';
import Sidebar from './ui/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 = 256px (w-64)

  useEffect(() => {
    // Check initial collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    const collapsed = saved ? JSON.parse(saved) : false;
    setSidebarCollapsed(collapsed);
    setSidebarWidth(collapsed ? 64 : 256);
  }, []);

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
    setSidebarWidth(collapsed ? 64 : 256);
  };

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <Sidebar onCollapseChange={handleCollapseChange} />}
      <main 
        className={`transition-all duration-300 ${isAuthenticated ? (sidebarCollapsed ? 'md:pl-16' : 'md:pl-64') : ''}`}
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

