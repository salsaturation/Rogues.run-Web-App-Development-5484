import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { useAuth } from './AuthContext';
import { DISTANCE_UNITS } from '../utils/unitConversion';

// Create context
const SettingsContext = createContext();

// Hook for using the settings context
export function useSettings() {
  return useContext(SettingsContext);
}

// Provider component
export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    clubName: 'Rogues.run',
    clubTagline: 'Join the Running Revolution',
    clubMotto: 'Every step counts, every mile matters',
    distanceUnit: DISTANCE_UNITS.KILOMETERS,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6'
  });
  const [loading, setLoading] = useState(true);

  // User-specific settings
  const [userSettings, setUserSettings] = useState({
    distanceUnit: null, // null means use club default
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Load user-specific settings when user changes
    if (user?.id) {
      loadUserSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const clubSettings = await settingsService.getClubSettings();
      setSettings(clubSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      if (!user?.id) return;
      const preferences = await settingsService.getUserSettings(user.id);
      setUserSettings(preferences);
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const updateUserSettings = async (newSettings) => {
    try {
      if (!user?.id) return false;
      
      await settingsService.updateUserSettings(user.id, newSettings);
      setUserSettings(prev => ({ ...prev, ...newSettings }));
      return true;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      return false;
    }
  };

  // Get the effective distance unit (user preference if set, otherwise club default)
  const effectiveDistanceUnit = userSettings.distanceUnit || settings.distanceUnit;

  // Create a value object to provide through the context
  const value = {
    ...settings,
    loading,
    reloadSettings: loadSettings,
    // User settings
    userSettings,
    updateUserSettings,
    // Effective settings (user preference overrides club default)
    distanceUnit: effectiveDistanceUnit,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}