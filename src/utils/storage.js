// Local storage utilities for offline functionality
export const STORAGE_KEYS = {
  USER_DATA: 'rogues_user_data',
  SESSIONS: 'rogues_sessions',
  MEMBERS: 'rogues_members',
  SETTINGS: 'rogues_settings',
  NOTIFICATIONS: 'rogues_notifications'
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
};

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from storage:', error);
    return false;
  }
};

export const clearAllStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

// Offline data management
export const syncOfflineData = async () => {
  try {
    // In a real app, this would sync offline data with the server
    console.log('Syncing offline data...');
    
    const offlineData = {
      sessions: loadFromStorage(STORAGE_KEYS.SESSIONS, []),
      members: loadFromStorage(STORAGE_KEYS.MEMBERS, []),
      settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {})
    };
    
    // Demo sync process
    console.log('Offline data to sync:', offlineData);
    
    return { success: true, syncedItems: Object.keys(offlineData).length };
  } catch (error) {
    console.error('Error syncing offline data:', error);
    return { success: false, error: error.message };
  }
};