import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settingsService';

const { 
  FiSettings, FiEdit, FiSave, FiX, FiGlobe, FiType, 
  FiImage, FiTwitter, FiInstagram, FiFacebook, FiMapPin, FiActivity
} = FiIcons;

function AdminPanel() {
  const { user } = useAuth();
  const { distanceUnit, reloadSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'strava', etc.
  const [clubSettings, setClubSettings] = useState({
    clubName: '',
    clubTagline: '',
    clubMotto: '',
    clubLogo: '',
    clubFavicon: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    description: '',
    website: '',
    distanceUnit: DISTANCE_UNITS.KILOMETERS,
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      strava: ''
    }
  });

  const [stravaSettings, setStravaSettings] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    clubId: '',
    syncFrequency: 'daily',
    autoSyncEnabled: true,
    webhooksEnabled: false
  });

  useEffect(() => {
    loadClubSettings();
    loadStravaSettings();
  }, []);

  const loadClubSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getClubSettings();
      setClubSettings(data);
    } catch (error) {
      console.error('Failed to load club settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadStravaSettings = async () => {
    try {
      // In a real app, this would load from the database
      setStravaSettings({
        clientId: process.env.STRAVA_CLIENT_ID || '',
        clientSecret: '••••••••••••••••••••••••••', // Masked for security
        redirectUri: `${window.location.origin}/strava-callback`,
        clubId: '',
        syncFrequency: 'daily',
        autoSyncEnabled: true,
        webhooksEnabled: false
      });
    } catch (error) {
      console.error('Failed to load Strava settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await settingsService.updateClubSettings(clubSettings);
      setIsEditing(false);
      reloadSettings();
      toast.success('Club settings updated successfully');
    } catch (error) {
      console.error('Failed to update club settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleSaveStravaSettings = async () => {
    try {
      // In a real app, this would save to the database
      toast.success('Strava settings updated successfully');
      
      // Mock saving to database
      setTimeout(() => {
        toast.success('Strava club connection verified');
      }, 1500);
    } catch (error) {
      console.error('Failed to update Strava settings:', error);
      toast.error('Failed to update Strava settings');
    }
  };

  const handleCancel = () => {
    loadClubSettings();
    setIsEditing(false);
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiSettings} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need admin privileges to access this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        {activeTab === 'general' && !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiEdit} className="w-4 h-4" />
            <span>Edit Settings</span>
          </button>
        ) : activeTab === 'general' ? (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <SafeIcon icon={FiX} className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveSettings}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('strava')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'strava'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" 
            alt="Strava"
            className="w-4 h-4"
          />
          <span>Strava Integration</span>
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Club Settings</h2>
          <div className="space-y-6">
            {/* Club Name & Branding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiType} className="w-4 h-4" />
                    <span>Club Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.clubName}
                  onChange={(e) => setClubSettings({...clubSettings, clubName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiType} className="w-4 h-4" />
                    <span>Tagline</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.clubTagline}
                  onChange={(e) => setClubSettings({...clubSettings, clubTagline: e.target.value})}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiType} className="w-4 h-4" />
                  <span>Motto</span>
                </div>
              </label>
              <input
                type="text"
                value={clubSettings.clubMotto}
                onChange={(e) => setClubSettings({...clubSettings, clubMotto: e.target.value})}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiType} className="w-4 h-4" />
                  <span>Description</span>
                </div>
              </label>
              <textarea
                value={clubSettings.description}
                onChange={(e) => setClubSettings({...clubSettings, description: e.target.value})}
                disabled={!isEditing}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            {/* Logo & Favicon URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiImage} className="w-4 h-4" />
                    <span>Logo URL</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.clubLogo}
                  onChange={(e) => setClubSettings({...clubSettings, clubLogo: e.target.value})}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiImage} className="w-4 h-4" />
                    <span>Favicon URL</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.clubFavicon}
                  onChange={(e) => setClubSettings({...clubSettings, clubFavicon: e.target.value})}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>

            {/* Website & Social Media */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiGlobe} className="w-4 h-4" />
                  <span>Website URL</span>
                </div>
              </label>
              <input
                type="text"
                value={clubSettings.website}
                onChange={(e) => setClubSettings({...clubSettings, website: e.target.value})}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiFacebook} className="w-4 h-4" />
                    <span>Facebook URL</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.socialMedia.facebook}
                  onChange={(e) => setClubSettings({
                    ...clubSettings,
                    socialMedia: {...clubSettings.socialMedia, facebook: e.target.value}
                  })}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiInstagram} className="w-4 h-4" />
                    <span>Instagram URL</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.socialMedia.instagram}
                  onChange={(e) => setClubSettings({
                    ...clubSettings,
                    socialMedia: {...clubSettings.socialMedia, instagram: e.target.value}
                  })}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiTwitter} className="w-4 h-4" />
                    <span>Twitter URL</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={clubSettings.socialMedia.twitter}
                  onChange={(e) => setClubSettings({
                    ...clubSettings,
                    socialMedia: {...clubSettings.socialMedia, twitter: e.target.value}
                  })}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
            </div>

            {/* Theme Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={clubSettings.primaryColor}
                    onChange={(e) => setClubSettings({...clubSettings, primaryColor: e.target.value})}
                    disabled={!isEditing}
                    className="h-10 w-10 rounded border-0"
                  />
                  <input
                    type="text"
                    value={clubSettings.primaryColor}
                    onChange={(e) => setClubSettings({...clubSettings, primaryColor: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={clubSettings.secondaryColor}
                    onChange={(e) => setClubSettings({...clubSettings, secondaryColor: e.target.value})}
                    disabled={!isEditing}
                    className="h-10 w-10 rounded border-0"
                  />
                  <input
                    type="text"
                    value={clubSettings.secondaryColor}
                    onChange={(e) => setClubSettings({...clubSettings, secondaryColor: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Distance Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                  <span>Default Distance Unit</span>
                </div>
              </label>
              <select
                value={clubSettings.distanceUnit}
                onChange={(e) => setClubSettings({...clubSettings, distanceUnit: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              >
                <option value={DISTANCE_UNITS.KILOMETERS}>Kilometers (km)</option>
                <option value={DISTANCE_UNITS.MILES}>Miles (mi)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This is the default unit for displaying distances and paces. Users can override this in their profile settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strava Integration Tab */}
      {activeTab === 'strava' && (
        <div className="space-y-6">
          {/* Strava Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg"
                  alt="Strava"
                  className="w-8 h-8"
                />
                <h2 className="text-xl font-semibold text-gray-900">Strava Integration</h2>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <SafeIcon icon={FiActivity} className="w-4 h-4" />
                <span>Not Connected</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Connect your running club with Strava to automatically sync activities, track group goals, and enhance member engagement.
            </p>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-orange-800 mb-2">Setup Instructions</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-orange-700">
                <li>Register as a Strava API developer at <a href="https://developers.strava.com" target="_blank" rel="noreferrer" className="underline">developers.strava.com</a></li>
                <li>Create a new API application for your running club</li>
                <li>Enter the Client ID and Client Secret below</li>
                <li>Set the Authorization Callback Domain to your website's domain</li>
                <li>Save the settings and click "Connect Strava" to authorize</li>
              </ol>
            </div>

            <div className="space-y-6">
              {/* API Credentials */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={stravaSettings.clientId}
                      onChange={(e) => setStravaSettings({...stravaSettings, clientId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your Strava API Client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={stravaSettings.clientSecret}
                      onChange={(e) => setStravaSettings({...stravaSettings, clientSecret: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your Strava API Client Secret"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
                  <input
                    type="text"
                    value={stravaSettings.redirectUri}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use this URL as your Authorization Callback Domain in your Strava API settings.
                  </p>
                </div>
              </div>

              {/* Club Connection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Club Connection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strava Club ID</label>
                    <input
                      type="text"
                      value={stravaSettings.clubId}
                      onChange={(e) => setStravaSettings({...stravaSettings, clubId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your Strava Club ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The numeric ID of your club on Strava (found in the URL of your club page).
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label>
                    <select
                      value={stravaSettings.syncFrequency}
                      onChange={(e) => setStravaSettings({...stravaSettings, syncFrequency: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sync Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Auto-Sync Activities</p>
                      <p className="text-sm text-gray-600">
                        Automatically sync member activities for goal tracking
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stravaSettings.autoSyncEnabled}
                        onChange={(e) => setStravaSettings({...stravaSettings, autoSyncEnabled: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Enable Webhooks</p>
                      <p className="text-sm text-gray-600">
                        Receive real-time updates when members record activities
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stravaSettings.webhooksEnabled}
                        onChange={(e) => setStravaSettings({...stravaSettings, webhooksEnabled: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={handleSaveStravaSettings}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <SafeIcon icon={FiSave} className="w-4 h-4" />
                  <span>Save Strava Settings</span>
                </button>

                <button
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  onClick={() => {
                    if (!stravaSettings.clientId || !stravaSettings.clientSecret) {
                      toast.error('Please enter your Strava API credentials first');
                      return;
                    }
                    toast.success('Starting Strava authorization flow...');
                    setTimeout(() => {
                      toast.success('Demo: Strava connected successfully!');
                    }, 1500);
                  }}
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" 
                    alt="Strava"
                    className="w-4 h-4"
                  />
                  <span>Connect Strava</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Connection Status & Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status & Statistics</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="mb-3 inline-block p-3 bg-yellow-100 rounded-full">
                  <SafeIcon icon={FiActivity} className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="font-medium text-gray-900">Not Connected</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Complete the setup above to connect your Strava club
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Connected Members</p>
                <p className="text-2xl font-bold text-gray-400">0</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Activities Synced</p>
                <p className="text-2xl font-bold text-gray-400">0</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-lg font-medium text-gray-400">Never</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Admin Links */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="#/admin/pace-groups" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex flex-col">
            <h3 className="font-semibold text-blue-800 mb-2">Pace Groups</h3>
            <p className="text-sm text-blue-600">Manage standard pace groups for sessions</p>
          </a>
          <a href="#/analytics" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex flex-col">
            <h3 className="font-semibold text-purple-800 mb-2">Analytics</h3>
            <p className="text-sm text-purple-600">View detailed usage statistics</p>
          </a>
          <a href="#/members" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex flex-col">
            <h3 className="font-semibold text-green-800 mb-2">Members</h3>
            <p className="text-sm text-green-600">Manage user accounts and permissions</p>
          </a>
          <a href="#/goals" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex flex-col">
            <h3 className="font-semibold text-orange-800 mb-2">Goals</h3>
            <p className="text-sm text-orange-600">Manage community goals</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;