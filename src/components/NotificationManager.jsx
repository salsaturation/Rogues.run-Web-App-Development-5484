import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { requestNotificationPermission, setupMessageListener } from '../utils/notifications';

const { FiBell, FiX, FiCheck } = FiIcons;

function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    setupMessageListener();
    
    // Check notification permission on mount
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setPermission('granted');
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Demo notifications for testing
  const demoNotifications = [
    {
      title: 'New Session Created',
      message: 'Morning Run scheduled for tomorrow at 7:00 AM',
      type: 'session'
    },
    {
      title: 'Session Reminder',
      message: 'Hill Training starts in 1 hour at Hill Park',
      type: 'reminder'
    },
    {
      title: 'New Member Joined',
      message: 'Sarah Johnson has joined the running group',
      type: 'member'
    }
  ];

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Permission Request */}
      {permission === 'default' && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
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

      {/* Demo Notification Trigger (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 space-y-2">
          {demoNotifications.map((demo, index) => (
            <button
              key={index}
              onClick={() => addNotification(demo)}
              className="bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Test: {demo.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationManager;