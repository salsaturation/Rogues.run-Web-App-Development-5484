import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settingsService';

const { FiSettings, FiEdit, FiSave, FiX, FiGlobe, FiType, FiImage, FiTwitter, FiInstagram, FiFacebook, FiMapPin } = FiIcons;

function AdminPanel() {
  const { user } = useAuth();
  const { distanceUnit, reloadSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadClubSettings();
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
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiEdit} className="w-4 h-4" />
            <span>Edit Settings</span>
          </button>
        ) : (
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
        )}
      </div>

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
                onChange={(e) => setClubSettings({ ...clubSettings, clubName: e.target.value })}
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
                onChange={(e) => setClubSettings({ ...clubSettings, clubTagline: e.target.value })}
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
              onChange={(e) => setClubSettings({ ...clubSettings, clubMotto: e.target.value })}
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
              onChange={(e) => setClubSettings({ ...clubSettings, description: e.target.value })}
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
                onChange={(e) => setClubSettings({ ...clubSettings, clubLogo: e.target.value })}
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
                onChange={(e) => setClubSettings({ ...clubSettings, clubFavicon: e.target.value })}
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
              onChange={(e) => setClubSettings({ ...clubSettings, website: e.target.value })}
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
                  socialMedia: {
                    ...clubSettings.socialMedia,
                    facebook: e.target.value
                  }
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
                  socialMedia: {
                    ...clubSettings.socialMedia,
                    instagram: e.target.value
                  }
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
                  socialMedia: {
                    ...clubSettings.socialMedia,
                    twitter: e.target.value
                  }
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
                  onChange={(e) => setClubSettings({ ...clubSettings, primaryColor: e.target.value })}
                  disabled={!isEditing}
                  className="h-10 w-10 rounded border-0"
                />
                <input
                  type="text"
                  value={clubSettings.primaryColor}
                  onChange={(e) => setClubSettings({ ...clubSettings, primaryColor: e.target.value })}
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
                  onChange={(e) => setClubSettings({ ...clubSettings, secondaryColor: e.target.value })}
                  disabled={!isEditing}
                  className="h-10 w-10 rounded border-0"
                />
                <input
                  type="text"
                  value={clubSettings.secondaryColor}
                  onChange={(e) => setClubSettings({ ...clubSettings, secondaryColor: e.target.value })}
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
              onChange={(e) => setClubSettings({ ...clubSettings, distanceUnit: e.target.value })}
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

      {/* Admin Links */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="#/admin/pace-groups"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex flex-col"
          >
            <h3 className="font-semibold text-blue-800 mb-2">Pace Groups</h3>
            <p className="text-sm text-blue-600">Manage standard pace groups for sessions</p>
          </a>
          
          <a
            href="#/analytics"
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex flex-col"
          >
            <h3 className="font-semibold text-purple-800 mb-2">Analytics</h3>
            <p className="text-sm text-purple-600">View detailed usage statistics</p>
          </a>
          
          <a
            href="#/members"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex flex-col"
          >
            <h3 className="font-semibold text-green-800 mb-2">Members</h3>
            <p className="text-sm text-green-600">Manage user accounts and permissions</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;