import React, {useEffect, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {analyticsService} from '../services/analyticsService';
import {useAuth} from '../contexts/AuthContext';

const {FiBell, FiX} = FiIcons;

function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState('default');
  const {user} = useAuth();

  useEffect(() => {
    // Check notification permission on mount
    if (window.Notification) {
      setPermission(Notification.permission);
    }

    // Listen for browser notification permission changes
    const handlePermissionChange = () => {
      if (window.Notification) {
        setPermission(Notification.permission);
      }
    };

    document.addEventListener('visibilitychange', handlePermissionChange);

    // Listen for custom notification events
    const handleShowNotification = (e) => {
      const {title, message, type} = e.detail;
      addNotification({
        title: title || 'Notification',
        message: message || 'New notification',
        type: type || 'info'
      });
    };

    document.addEventListener('show-notification', handleShowNotification);

    return () => {
      document.removeEventListener('visibilitychange', handlePermissionChange);
      document.removeEventListener('show-notification', handleShowNotification);
    };
  }, []);

  const requestPermission = async () => {
    try {
      if (window.Notification) {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        if (permission === 'granted' && user?.id) {
          analyticsService.trackEvent('notification_permission_granted', user.id);
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Track notification displayed
    if (user?.id) {
      analyticsService.trackEvent('notification_displayed', user.id, {
        notification_type: notification.type,
        notification_title: notification.title
      });
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Permission Request */}
      {permission === 'default' && (
        <motion.div
          initial={{opacity: 0, x: 300}}
          animate={{opacity: 1, x: 0}}
          className="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm"
        >
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiBell} className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-blue-100">Stay updated on sessions and activities</p>
            </div>
            <button
              onClick={requestPermission}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Enable
            </button>
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{opacity: 0, x: 300}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: 300}}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <SafeIcon icon={FiBell} className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{notification.title}</p>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default NotificationManager;