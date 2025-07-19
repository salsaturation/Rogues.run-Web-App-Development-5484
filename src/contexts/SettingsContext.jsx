import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { DISTANCE_UNITS } from '../utils/unitConversion';

// Create context
const SettingsContext = createContext();

// Hook for using the settings context
export function useSettings() {
  return useContext(SettingsContext);
}

// Provider component
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    clubName: 'Rogues.run',
    clubTagline: 'Join the Running Revolution',
    clubMotto: 'Every step counts, every mile matters',
    distanceUnit: DISTANCE_UNITS.KILOMETERS,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6'
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

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

  // Create a value object to provide through the context
  const value = {
    ...settings,
    loading,
    reloadSettings: loadSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}