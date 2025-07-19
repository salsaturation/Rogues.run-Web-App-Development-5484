import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DISTANCE_UNITS } from '../utils/unitConversion';

const { FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiSave, FiX, FiCamera, FiActivity, FiCalendar, FiAward, FiTrendingUp, FiClock, FiPlus, FiTrash2 } = FiIcons;

function Profile() {
  const { user, updateUserProfile } = useAuth();
  const { userSettings, updateUserSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: 'New York, NY',
    bio: 'Passionate runner and community member',
    pacePreferences: user?.pacePreferences || [],
    distanceUnit: userSettings?.distanceUnit || null, // null means use club default
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      sessionReminders: true,
      weeklyDigest: false
    }
  });
  
  const [newPacePreference, setNewPacePreference] = useState({
    pace: '',
    runType: 'easy'
  });

  const stats = [
    { label: 'Sessions Attended', value: '42', icon: FiActivity, color: 'blue' },
    { label: 'Member Since', value: '2023', icon: FiCalendar, color: 'green' },
    { label: 'Achievements', value: '8', icon: FiAward, color: 'purple' },
    { label: 'Streak', value: '12 days', icon: FiTrendingUp, color: 'orange' }
  ];

  const achievements = [
    { id: 1, title: 'First Run', description: 'Completed your first session', earned: true },
    { id: 2, title: 'Consistent Runner', description: 'Attended 10 sessions', earned: true },
    { id: 3, title: 'Community Member', description: 'Been a member for 6 months', earned: true },
    { id: 4, title: 'Early Bird', description: 'Attended 5 morning sessions', earned: true },
    { id: 5, title: 'Marathon Ready', description: 'Completed 50 sessions', earned: false },
    { id: 6, title: 'Social Runner', description: 'Invited 5 new members', earned: false }
  ];

  // Load user pace preferences and settings on mount
  useEffect(() => {
    if (user?.pacePreferences) {
      setProfileData(prev => ({
        ...prev,
        pacePreferences: user.pacePreferences
      }));
    }
    
    // Load user unit preferences
    if (userSettings) {
      setProfileData(prev => ({
        ...prev,
        distanceUnit: userSettings.distanceUnit
      }));
    }
  }, [user, userSettings]);

  const handleSave = async () => {
    // Save profile data
    const profileUpdateResult = await updateUserProfile({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      location: profileData.location,
      bio: profileData.bio,
      pacePreferences: profileData.pacePreferences
    });

    // Save user settings
    const settingsUpdateResult = await updateUserSettings({
      distanceUnit: profileData.distanceUnit
    });

    setIsEditing(false);
    
    if (profileUpdateResult && settingsUpdateResult) {
      toast.success('Profile and preferences updated successfully!');
    } else {
      toast.error('Some updates failed. Please try again.');
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: 'New York, NY',
      bio: 'Passionate runner and community member',
      pacePreferences: user?.pacePreferences || [],
      distanceUnit: userSettings?.distanceUnit || null,
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        weeklyDigest: false
      }
    });
    setIsEditing(false);
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddPacePreference = () => {
    if (!newPacePreference.pace || isNaN(parseFloat(newPacePreference.pace))) {
      toast.error('Please enter a valid pace');
      return;
    }

    const pace = parseFloat(newPacePreference.pace);
    const updatedPreferences = [
      ...profileData.pacePreferences,
      {
        id: Date.now(),
        pace: pace,
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

  const runTypes = [
    { value: 'easy', label: 'Easy' },
    { value: 'tempo', label: 'Tempo' },
    { value: 'interval', label: 'Interval' },
    { value: 'long-slow', label: 'Long Run' },
    { value: 'trail', label: 'Trail' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <SafeIcon icon={FiUser} className="w-12 h-12 text-white" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
              <SafeIcon icon={FiCamera} className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user?.isAdmin ? 'bg-purple-100 text-purple-800' : 
                    user?.canPublish ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {user?.isAdmin ? 'Admin' : user?.canPublish ? 'Publisher' : 'Member'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Member since {new Date(user?.joinDate || '2023-01-01').getFullYear()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={isEditing ? FiX : FiEdit} className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiSave} className="w-4 h-4" />
                <span>Save</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profileData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profileData.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profileData.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profileData.bio}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pace Preferences */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pace Preferences</h2>
            <div className="flex items-center text-sm text-gray-600">
              <SafeIcon icon={FiClock} className="w-4 h-4 mr-1" />
              <span>min/km</span>
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
                        {formatPace(preference.pace)} min/km
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
              <h3 className="font-medium text-gray-900 mb-3">Add Pace Preference</h3>
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pace (min/km)</label>
                  <input
                    type="number"
                    value={newPacePreference.pace}
                    onChange={(e) => setNewPacePreference({ ...newPacePreference, pace: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                    min="3"
                    placeholder="e.g., 5.5"
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
                Add your preferred paces for different run types. This helps match you with suitable pace groups.
              </p>
            </div>
          )}

          {/* Unit Preferences */}
          {isEditing && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Unit Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance Unit</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="distanceUnit"
                        checked={profileData.distanceUnit === null}
                        onChange={() => setProfileData({ ...profileData, distanceUnit: null })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Use Club Default</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="distanceUnit"
                        checked={profileData.distanceUnit === 'km'}
                        onChange={() => setProfileData({ ...profileData, distanceUnit: 'km' })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Kilometers (km)</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="distanceUnit"
                        checked={profileData.distanceUnit === 'mi'}
                        onChange={() => setProfileData({ ...profileData, distanceUnit: 'mi' })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Miles (mi)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This setting affects how distances and paces are displayed throughout the app.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
          <div className="space-y-4">
            {Object.entries(profileData.preferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-600">
                    {key === 'emailNotifications' && 'Receive notifications via email'}
                    {key === 'pushNotifications' && 'Receive push notifications'}
                    {key === 'sessionReminders' && 'Get reminders before sessions'}
                    {key === 'weeklyDigest' && 'Weekly summary of activities'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      preferences: { ...profileData.preferences, [key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.earned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.earned ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}
                >
                  <SafeIcon icon={FiAward} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-medium ${achievement.earned ? 'text-yellow-800' : 'text-gray-600'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${achievement.earned ? 'text-yellow-700' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;