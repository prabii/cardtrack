import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import Icon from '../AppIcon';
import Button from './Button';
import RealtimeNotifications from '../RealtimeNotifications';
import OnlineUsers from '../OnlineUsers';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected, onlineUsers } = useRealtime();
  const userMenuRef = useRef(null);

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'manager', 'member', 'gateway_manager'] },
    { label: 'Cardholders', path: '/cardholders', icon: 'Users', roles: ['admin', 'manager', 'member'] },
    { label: 'Bill Payments', path: '/bill-payments', icon: 'CreditCard', roles: ['admin', 'manager', 'member', 'gateway_manager'] },
    { label: 'Bank Data', path: '/bank-data', icon: 'BuildingLibrary', roles: ['admin', 'manager', 'gateway_manager'] },
    { label: 'Statements', path: '/statements', icon: 'DocumentText', roles: ['admin', 'manager'] },
    { label: 'Transactions', path: '/transactions', icon: 'Receipt', roles: ['admin', 'manager', 'gateway_manager'] },
    { label: 'Bank Summaries', path: '/bank-summaries', icon: 'BarChart3', roles: ['admin', 'manager', 'gateway_manager'] },
    { label: 'Users', path: '/users', icon: 'UserGroup', roles: ['admin', 'manager'] },
    { label: 'Reports', path: '/reports', icon: 'BarChart3', roles: ['admin', 'manager'] },
    { label: 'Company', path: '/company', icon: 'BuildingOffice', roles: ['admin', 'manager'] },
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
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    // Navigate to appropriate dashboard based on user role
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else if (user?.role === 'manager') {
      navigate('/dashboard');
    } else if (user?.role === 'member') {
      navigate('/dashboard');
    } else if (user?.role === 'gateway_manager') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Icon name="CreditCard" size={20} color="white" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              CardTracker Pro
            </span>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {getFilteredNavigationItems()?.map((item) => (
            <Button
              key={item?.path}
              variant={location?.pathname === item?.path ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation(item?.path)}
              iconName={item?.icon}
              iconPosition="left"
              iconSize={16}
              className="px-3"
            >
              {item?.label}
            </Button>
          ))}
        </nav>

        {/* User Actions & Mobile Menu */}
        <div className="flex items-center space-x-2">
          {/* Real-time Connection Status - Admin Only */}
          {user?.role === 'admin' && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                {connected ? `${onlineUsers.filter(u => u.userId !== user?.id).length} online` : 'Offline'}
              </span>
            </div>
          )}

          {/* Real-time Notifications - Admin Only */}
          {user?.role === 'admin' && <RealtimeNotifications />}

          {/* Direct Logout Button - Mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="md:hidden text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Logout"
          >
            <Icon name="LogOut" size={16} />
            <span className="ml-1">Logout</span>
          </Button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleUserMenu}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2"
              title="User Menu"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </span>
            </Button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Icon name="User" size={16} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Icon name="Settings" size={16} />
                  <span>Settings</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium"
                >
                  <Icon name="LogOut" size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
          </Button>
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border">
          <nav className="px-4 py-2 space-y-1">
            {getFilteredNavigationItems()?.map((item) => (
              <Button
                key={item?.path}
                variant={location?.pathname === item?.path ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavigation(item?.path)}
                iconName={item?.icon}
                iconPosition="left"
                iconSize={16}
                fullWidth
                className="justify-start"
              >
                {item?.label}
              </Button>
            ))}
            
            {/* Mobile Logout Button */}
            <hr className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              iconName="LogOut"
              iconPosition="left"
              iconSize={16}
              fullWidth
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Logout
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;