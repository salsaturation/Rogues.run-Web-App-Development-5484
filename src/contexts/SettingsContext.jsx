import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { settingsService } from '../services/settingsService';
import { DISTANCE_UNITS } from '../utils/unitConversion';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const data = await settingsService.getClubSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set default settings
      setSettings({
        clubName: 'Rogues.run',
        clubTagline: 'Join the Running Revolution',
        clubMotto: 'Every step counts, every mile matters',
        clubLogo: '',
        clubFavicon: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        description: 'A community of passionate runners pushing boundaries together.',
        website: '',
        distanceUnit: DISTANCE_UNITS.KILOMETERS,
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          strava: ''
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      if (!user?.id) return;
      
      const preferences = await settingsService.getUserSettings(user.id);
      setUserSettings(preferences);
      
      // Log the loaded preferences to help debug
      console.log('Loaded user settings:', preferences);
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const updateUserSettings = async (newSettings) => {
    try {
      if (!user?.id) return;
      
      await settingsService.updateUserSettings(user.id, newSettings);
      setUserSettings({ ...userSettings, ...newSettings });
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw error;
    }
  };

  // Add a method to get the effective distance unit with a default
  const getEffectiveDistanceUnit = () => {
    // First check user settings
    if (userSettings && userSettings.distanceUnit) {
      return userSettings.distanceUnit;
    }
    
    // Then check club settings
    if (settings && settings.distanceUnit) {
      return settings.distanceUnit;
    }
    
    // Default to kilometers
    return DISTANCE_UNITS.KILOMETERS;
  };

  // Create a value object with the effective distance unit
  const value = {
    ...settings,
    loading,
    reloadSettings: loadSettings,
    
    // User settings
    userSettings,
    updateUserSettings,
    
    // Effective settings (user preference overrides club default)
    distanceUnit: getEffectiveDistanceUnit(),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}