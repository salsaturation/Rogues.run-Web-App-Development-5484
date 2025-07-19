import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';
import { convertPace, DISTANCE_UNITS } from '../utils/unitConversion';

const { FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiSave, FiX, FiClock, FiPlus, FiTrash2, FiSettings } = FiIcons;

function Profile() {
  const { user, updateUserProfile } = useAuth();
  const { distanceUnit, userSettings, updateUserSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    pacePreferences: []
  });
  const [newPacePreference, setNewPacePreference] = useState({
    pace: '',
    runType: 'easy'
  });

  const runTypes = [
    { value: 'easy', label: 'Easy Run' },
    { value: 'tempo', label: 'Tempo Run' },
    { value: 'interval', label: 'Interval Training' },
    { value: 'long-slow', label: 'Long Slow Distance' },
    { value: 'trail', label: 'Trail Running' }
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        pacePreferences: user.pacePreferences || []
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateUserProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        pacePreferences: user.pacePreferences || []
      });
    }
    setIsEditing(false);
  };

  const handleAddPacePreference = () => {
    if (!newPacePreference.pace || isNaN(parseFloat(newPacePreference.pace))) {
      toast.error('Please enter a valid pace');
      return;
    }
    
    const displayPace = parseFloat(newPacePreference.pace);
    
    // Convert pace to storage unit (km) if user is using miles
    let storagePace = displayPace;
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      storagePace = convertPace(displayPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
    }
    
    const updatedPreferences = [
      ...profileData.pacePreferences,
      {
        id: Date.now(),
        pace: storagePace, // Store in km
        runType: newPacePreference.runType
      }
    ];
    
    setProfileData({ ...profileData, pacePreferences: updatedPreferences });
    setNewPacePreference({ pace: '', runType: 'easy' });
    toast.success('Pace preference added');
  };

  const handleRemovePacePreference = (id) => {
    const updatedPreferences = profileData.pacePreferences.filter(pref => pref.id !== id);
    setProfileData({ ...profileData, pacePreferences: updatedPreferences });
    toast.success('Pace preference removed');
  };

  const formatPace = (pace) => {
    if (!pace) return 'N/A';
    
    // Convert from storage unit (km) to display unit if needed
    let displayPace = pace;
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      displayPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
    }
    
    const minutes = Math.floor(displayPace);
    const seconds = Math.round((displayPace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRunTypeColor = (type) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'tempo': 'bg-blue-100 text-blue-800',
      'interval': 'bg-purple-100 text-purple-800',
      'long-slow': 'bg-yellow-100 text-yellow-800',
      'trail': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleUpdateDistanceUnit = async (newUnit) => {
    try {
      await updateUserSettings({ distanceUnit: newUnit });
      toast.success(`Distance unit updated to ${newUnit}`);
    } catch (error) {
      console.error('Failed to update distance unit:', error);
      toast.error('Failed to update distance unit');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiEdit} className="w-4 h-4" />
            <span>Edit Profile</span>
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
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiUser} className="w-4 h-4 text-gray-500" />
                  <span>{profileData.name || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMail} className="w-4 h-4 text-gray-500" />
                <span>{profileData.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiPhone} className="w-4 h-4 text-gray-500" />
                  <span>{profileData.phone || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMapPin} className="w-4 h-4 text-gray-500" />
                  <span>{profileData.location || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-600">{profileData.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* User Preferences */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>
          
          {/* Distance Unit Preference */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiSettings} className="w-4 h-4" />
                <span>Distance Unit</span>
              </div>
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => handleUpdateDistanceUnit(DISTANCE_UNITS.KILOMETERS)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  distanceUnit === DISTANCE_UNITS.KILOMETERS
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Kilometers (km)
              </button>
              <button
                onClick={() => handleUpdateDistanceUnit(DISTANCE_UNITS.MILES)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  distanceUnit === DISTANCE_UNITS.MILES
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Miles (mi)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This affects how distances and paces are displayed throughout the app.
            </p>
          </div>

          {/* Pace Preferences */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Pace Preferences</h3>
            <div className="flex items-center text-sm text-gray-600">
              <SafeIcon icon={FiClock} className="w-4 h-4 mr-1" />
              <span>min/{distanceUnit}</span>
            </div>
          </div>
          
          {/* Current Pace Preferences */}
          <div className="space-y-4 mb-6">
            {profileData.pacePreferences && profileData.pacePreferences.length > 0 ? (
              <div className="space-y-3">
                {profileData.pacePreferences.map((preference) => (
                  <div key={preference.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(preference.runType)}`}>
                        {runTypes.find(type => type.value === preference.runType)?.label || preference.runType}
                      </div>
                      <div className="font-medium">
                        {formatPace(preference.pace)} min/{distanceUnit}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleRemovePacePreference(preference.id)}
                        className="p-1 hover:bg-red-50 rounded-full text-red-500"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No pace preferences set</p>
                {isEditing && (
                  <p className="text-sm text-gray-500 mt-1">Add your preferred paces below</p>
                )}
              </div>
            )}
          </div>
          
          {/* Add New Pace Preference */}
          {isEditing && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Add Pace Preference</h4>
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pace (min/{distanceUnit})
                  </label>
                  <input
                    type="number"
                    value={newPacePreference.pace}
                    onChange={(e) => setNewPacePreference({ ...newPacePreference, pace: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                    min="3"
                    placeholder={`e.g., ${distanceUnit === DISTANCE_UNITS.KILOMETERS ? '5.5' : '8.5'}`}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Run Type</label>
                  <select
                    value={newPacePreference.runType}
                    onChange={(e) => setNewPacePreference({ ...newPacePreference, runType: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {runTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddPacePreference}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <SafeIcon icon={FiPlus} className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Add your preferred paces for different run types in min/{distanceUnit}. This helps match you with suitable pace groups.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{user?.sessionsAttended || 0}</p>
            <p className="text-sm text-gray-600">Sessions Attended</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {user?.joinDate ? Math.floor((new Date() - new Date(user.joinDate)) / (1000 * 60 * 60 * 24)) : 0}
            </p>
            <p className="text-sm text-gray-600">Days as Member</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{profileData.pacePreferences.length}</p>
            <p className="text-sm text-gray-600">Pace Preferences</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;