import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';
import { paceGroupService } from '../services/paceGroupService';
import { settingsService } from '../services/settingsService';

const {
  FiShield, FiUsers, FiSettings, FiActivity, FiBell, FiBarChart3,
  FiCheck, FiX, FiEdit, FiTrash2, FiPlus, FiDownload, FiUpload,
  FiClock, FiSave, FiList, FiImage, FiGlobe, FiHash
} = FiIcons;

function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Pace group settings
  const [pacerSettings, setPacerSettings] = useState({
    pacerRoleTitle: 'Pacer',
    shadowRoleTitle: 'Shadow Pacer',
    allowMultiGroupVolunteering: true,
    autoAssignPacers: true,
    requireApproval: true
  });

  // Club branding settings
  const [clubSettings, setClubSettings] = useState({
    clubName: 'Rogues.run',
    clubTagline: 'Join the Running Revolution',
    clubMotto: 'Every step counts, every mile matters',
    clubLogo: '',
    clubFavicon: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    description: 'A community of passionate runners pushing boundaries together.',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      strava: ''
    }
  });

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const [pacerData, clubData] = await Promise.all([
        paceGroupService.getPacerSettings(),
        settingsService.getClubSettings()
      ]);
      setPacerSettings(pacerData);
      setClubSettings(clubData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        paceGroupService.updatePacerSettings(pacerSettings),
        settingsService.updateClubSettings(clubSettings)
      ]);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiShield} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need admin privileges to access this page</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart3 },
    { id: 'members', label: 'Member Management', icon: FiUsers },
    { id: 'sessions', label: 'Session Management', icon: FiActivity },
    { id: 'pace-groups', label: 'Pace Groups', icon: FiList },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  const pendingMembers = [
    { id: 1, name: 'Tom Wilson', email: 'tom@example.com', phone: '+1234567894', joinDate: '2024-01-10' },
    { id: 2, name: 'Emma Davis', email: 'emma@example.com', phone: '+1234567895', joinDate: '2024-01-12' }
  ];

  const systemStats = [
    { label: 'Total Members', value: '28', change: '+3', color: 'blue' },
    { label: 'Active Sessions', value: '12', change: '+2', color: 'green' },
    { label: 'Pending Approvals', value: '2', change: '0', color: 'yellow' },
    { label: 'Monthly Growth', value: '15%', change: '+5%', color: 'purple' }
  ];

  const handleApproveMember = (memberId) => {
    toast.success('Member approved successfully');
  };

  const handleRejectMember = (memberId) => {
    toast.success('Member rejected');
  };

  const sendNotification = () => {
    toast.success('Notification sent to all members');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-purple-100 text-lg">Manage your running community</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiShield} className="w-10 h-10" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SafeIcon icon={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className={`text-sm font-medium mt-1 ${
                          stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={sendNotification}
                  className="p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
                >
                  <SafeIcon icon={FiBell} className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Send Notification</h3>
                  <p className="text-sm text-gray-600">Notify all members about updates</p>
                </button>

                <button className="p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left">
                  <SafeIcon icon={FiDownload} className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Export Data</h3>
                  <p className="text-sm text-gray-600">Download member and session data</p>
                </button>

                <button 
                  onClick={() => setActiveTab('pace-groups')}
                  className="p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left"
                >
                  <SafeIcon icon={FiList} className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Manage Pace Groups</h3>
                  <p className="text-sm text-gray-600">Configure standard pace groups</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Pending Member Approvals</h2>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingMembers.length} pending
                </span>
              </div>

              <div className="space-y-4">
                {pendingMembers.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiUsers} className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <p className="text-sm text-gray-500">{member.phone}</p>
                          <p className="text-xs text-gray-400">Applied: {member.joinDate}</p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApproveMember(member.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiCheck} className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectMember(member.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiX} className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pendingMembers.length === 0 && (
                <div className="text-center py-12">
                  <SafeIcon icon={FiCheck} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
                  <p className="text-gray-500">All member requests have been processed</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Session Management</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <SafeIcon icon={FiPlus} className="w-4 h-4" />
                  <span>Create Session</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {['Morning Run - Central Park', 'Hill Training - Hill Park', 'Weekend Long Run - Riverside'].map(
                    (session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-900">{session}</span>
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                            <SafeIcon icon={FiEdit} className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50">
                            <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pace-groups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Standard Pace Groups</h2>
                <button 
                  onClick={() => window.location.hash = '/admin/pace-groups'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <SafeIcon icon={FiList} className="w-4 h-4" />
                  <span>Manage Pace Groups</span>
                </button>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">About Pace Groups</h3>
                <p className="text-blue-800 mb-4">
                  Standard pace groups are used as templates when creating sessions and help match runners 
                  with appropriate groups based on their pace preferences.
                </p>
                <button 
                  onClick={() => window.location.hash = '/admin/pace-groups'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Configure Pace Groups
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Send Notifications</h2>

              <div className="bg-gray-50 rounded-xl p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Type
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Session Announcement</option>
                      <option>General Update</option>
                      <option>Emergency Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter notification message"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiBell} className="w-5 h-5" />
                      <span>Send Notification</span>
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
                <button 
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <SafeIcon icon={FiSave} className="w-4 h-4" />
                  <span>Save All Settings</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Club Branding Settings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                      <SafeIcon icon={FiImage} className="w-5 h-5" />
                      <span>Club Branding</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Club Name</label>
                        <input
                          type="text"
                          value={clubSettings.clubName}
                          onChange={(e) => setClubSettings({...clubSettings, clubName: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your Running Club Name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                        <input
                          type="text"
                          value={clubSettings.clubTagline}
                          onChange={(e) => setClubSettings({...clubSettings, clubTagline: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your club's tagline or slogan"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Club Motto</label>
                        <input
                          type="text"
                          value={clubSettings.clubMotto}
                          onChange={(e) => setClubSettings({...clubSettings, clubMotto: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Inspirational motto for your club"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Club Logo URL</label>
                        <input
                          type="url"
                          value={clubSettings.clubLogo}
                          onChange={(e) => setClubSettings({...clubSettings, clubLogo: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                        <input
                          type="url"
                          value={clubSettings.clubFavicon}
                          onChange={(e) => setClubSettings({...clubSettings, clubFavicon: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/favicon.ico"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={clubSettings.primaryColor}
                            onChange={(e) => setClubSettings({...clubSettings, primaryColor: e.target.value})}
                            className="w-16 h-12 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={clubSettings.primaryColor}
                            onChange={(e) => setClubSettings({...clubSettings, primaryColor: e.target.value})}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={clubSettings.secondaryColor}
                            onChange={(e) => setClubSettings({...clubSettings, secondaryColor: e.target.value})}
                            className="w-16 h-12 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={clubSettings.secondaryColor}
                            onChange={(e) => setClubSettings({...clubSettings, secondaryColor: e.target.value})}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={clubSettings.description}
                          onChange={(e) => setClubSettings({...clubSettings, description: e.target.value})}
                          rows="3"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brief description of your running club"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={clubSettings.website}
                          onChange={(e) => setClubSettings({...clubSettings, website: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://yourclub.com"
                        />
                      </div>
                      
                      <div />
                      
                      {/* Social Media */}
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                          <SafeIcon icon={FiHash} className="w-4 h-4" />
                          <span>Social Media</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                            <input
                              type="text"
                              value={clubSettings.socialMedia.facebook}
                              onChange={(e) => setClubSettings({
                                ...clubSettings, 
                                socialMedia: {...clubSettings.socialMedia, facebook: e.target.value}
                              })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="@yourclub"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                            <input
                              type="text"
                              value={clubSettings.socialMedia.instagram}
                              onChange={(e) => setClubSettings({
                                ...clubSettings, 
                                socialMedia: {...clubSettings.socialMedia, instagram: e.target.value}
                              })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="@yourclub"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                            <input
                              type="text"
                              value={clubSettings.socialMedia.twitter}
                              onChange={(e) => setClubSettings({
                                ...clubSettings, 
                                socialMedia: {...clubSettings.socialMedia, twitter: e.target.value}
                              })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="@yourclub"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Strava</label>
                            <input
                              type="text"
                              value={clubSettings.socialMedia.strava}
                              onChange={(e) => setClubSettings({
                                ...clubSettings, 
                                socialMedia: {...clubSettings.socialMedia, strava: e.target.value}
                              })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Club name on Strava"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pace Group Settings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                      <SafeIcon icon={FiList} className="w-5 h-5" />
                      <span>Pace Group Settings</span>
                    </h3>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Pacer Title</label>
                        <input
                          type="text"
                          value={pacerSettings.pacerRoleTitle}
                          onChange={(e) => setPacerSettings({...pacerSettings, pacerRoleTitle: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Title for members who lead pace groups</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shadow Pacer Title</label>
                        <input
                          type="text"
                          value={pacerSettings.shadowRoleTitle}
                          onChange={(e) => setPacerSettings({...pacerSettings, shadowRoleTitle: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Title for members who assist primary pacers</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <SafeIcon icon={FiUsers} className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Allow Multi-Group Volunteering</p>
                            <p className="text-xs text-gray-600">Allow pacers to volunteer for multiple pace groups at once</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pacerSettings.allowMultiGroupVolunteering}
                            onChange={(e) => setPacerSettings({...pacerSettings, allowMultiGroupVolunteering: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <SafeIcon icon={FiActivity} className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Auto-Assign Pacers</p>
                            <p className="text-xs text-gray-600">Automatically assign pacers based on their preferences</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pacerSettings.autoAssignPacers}
                            onChange={(e) => setPacerSettings({...pacerSettings, autoAssignPacers: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <SafeIcon icon={FiCheck} className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Require Approval</p>
                            <p className="text-xs text-gray-600">Require admin approval for pacer assignments</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pacerSettings.requireApproval}
                            onChange={(e) => setPacerSettings({...pacerSettings, requireApproval: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;