import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Building2, 
  FileText, 
  Receipt, 
  BarChart3, 
  Bell, 
  Building,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

const Sidebar = ({ onCollapseChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'member', 'gateway_manager', 'operator'] },
    { label: 'Cardholders', path: '/cardholders', icon: Users, roles: ['admin', 'manager', 'member', 'operator'] },
    { label: 'Bill Payments', path: '/bill-payments', icon: CreditCard, roles: ['admin', 'manager', 'member', 'gateway_manager', 'operator'] },
    { label: 'Bank Data', path: '/bank-data', icon: Building2, roles: ['admin', 'manager', 'gateway_manager'] },
    { label: 'Statements', path: '/statements', icon: FileText, roles: ['admin', 'manager', 'member'] },
    { label: 'Transactions', path: '/transactions', icon: Receipt, roles: ['admin', 'manager', 'gateway_manager', 'operator'] },
    { label: 'Bank Summaries', path: '/bank-summaries', icon: BarChart3, roles: ['admin', 'manager', 'gateway_manager'] },
    { label: 'Gateways', path: '/gateways', icon: CreditCard, roles: ['admin', 'gateway_manager', 'operator'] },
    { label: 'Users', path: '/users', icon: Users, roles: ['admin', 'manager'] },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager', 'operator'] },
    { label: 'Alerts', path: '/alerts', icon: Bell, roles: ['admin', 'manager', 'operator'] },
    { label: 'Company', path: '/company', icon: Building, roles: ['admin', 'manager'] },
  ];

  // Filter navigation items based on user role
  const getFilteredNavigationItems = () => {
    if (!user?.role) return [];
    return navigationItems.filter(item => 
      item.roles.includes(user.role)
    );
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const filteredItems = getFilteredNavigationItems();

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 hidden md:block ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      data-collapsed={isCollapsed}
    >
      {/* Sidebar Content */}
      <div className="flex flex-col h-full">
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path || 
                             (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <IconComponent 
                    size={20} 
                    className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} 
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.role || 'Member'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="text-gray-500" />
            ) : (
              <ChevronLeft size={20} className="text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

