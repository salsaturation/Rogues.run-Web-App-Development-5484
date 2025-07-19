import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import toast from 'react-hot-toast';

const vapidKey = "demo-vapid-key";

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

export const setupMessageListener = () => {
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    toast.success(payload.notification?.title || 'New notification');
  });
};

export const sendNotificationToAll = async (title, body) => {
  // In a real app, this would call your backend API
  // which would send notifications via Firebase Admin SDK
  console.log('Sending notification:', { title, body });
  
  // Demo implementation - show local notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/running-icon.svg',
      badge: '/running-icon.svg'
    });
  }
  
  return { success: true };
};

export const scheduleSessionReminder = (sessionData) => {
  // In a real app, this would schedule notifications
  console.log('Scheduling reminder for session:', sessionData);
  
  // Demo implementation
  const reminderTime = new Date(sessionData.date + 'T' + sessionData.time);
  reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before
  
  const now = new Date();
  const timeUntilReminder = reminderTime.getTime() - now.getTime();
  
  if (timeUntilReminder > 0) {
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Upcoming Session: ${sessionData.title}`, {
          body: `Starting in 1 hour at ${sessionData.location}`,
          icon: '/running-icon.svg'
        });
      }
    }, Math.min(timeUntilReminder, 2147483647)); // Max setTimeout value
  }
};