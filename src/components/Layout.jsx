import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { analyticsService } from '../services/analyticsService';

const {
  FiHome,
  FiCalendar,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiActivity,
  FiShield,
  FiBell,
  FiUser,
  FiTarget,
  FiBarChart2
} = FiIcons;

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Sessions', href: '/sessions', icon: FiActivity },
    { name: 'Calendar', href: '/calendar', icon: FiCalendar },
    { name: 'Members', href: '/members', icon: FiUsers },
    { name: 'Goals', href: '/goals', icon: FiTarget },
    { name: 'Profile', href: '/profile', icon: FiUser },
  ];

  if (user?.isAdmin) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: FiShield });
    navigation.push({ name: 'Analytics', href: '/analytics', icon: FiBarChart2 });
  }

  useEffect(() => {
    // Track page view when route changes
    const currentPath = location.pathname;
    if (user?.id) {
      analyticsService.trackPageView(currentPath, user.id);
    }
  }, [location.pathname, user]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:static lg:translate-x-0 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiActivity} className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Rogues.run</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <SafeIcon icon={FiUser} className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.isAdmin ? 'Admin' : user?.canPublish ? 'Publisher' : 'Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiLogOut} className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <SafeIcon icon={FiMenu} className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigation.find((item) => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 relative"
                onClick={() => {
                  const event = new CustomEvent('show-notification', {
                    detail: {
                      title: 'New Notification',
                      message: 'This is a test notification',
                      type: 'info'
                    }
                  });
                  document.dispatchEvent(event);
                }}
              >
                <SafeIcon icon={FiBell} className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full notification-badge"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;