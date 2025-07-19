import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import toast from 'react-hot-toast';

const { FiSettings, FiUsers, FiActivity, FiSave, FiCheck, FiX } = FiIcons;

function PacerSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    pacerRoleTitle: 'Pacer',
    shadowRoleTitle: 'Shadow Pacer',
    allowMultiGroupVolunteering: true,
    autoAssignPacers: true,
    requireApproval: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await paceGroupService.getPacerSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load pacer settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await paceGroupService.updatePacerSettings(settings);
      toast.success('Pacer settings updated successfully');
    } catch (error) {
      console.error('Failed to save pacer settings:', error);
      toast.error('Failed to save pacer settings');
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiSettings} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can access pacer settings</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pacer Settings</h1>
        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiSave} className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Titles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Titles</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Pacer Title
              </label>
              <input
                type="text"
                value={settings.pacerRoleTitle}
                onChange={(e) => setSettings({ ...settings, pacerRoleTitle: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Pacer, Run Leader, Group Leader"
              />
              <p className="text-sm text-gray-500 mt-1">
                The title used for members who lead pace groups
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shadow Pacer Title
              </label>
              <input
                type="text"
                value={settings.shadowRoleTitle}
                onChange={(e) => setSettings({ ...settings, shadowRoleTitle: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Shadow Pacer, Assistant, Trainee"
              />
              <p className="text-sm text-gray-500 mt-1">
                The title used for members who assist or train as pacers
              </p>
            </div>
          </div>
        </motion.div>

        {/* System Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiUsers} className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Allow Multi-Group Volunteering</p>
                  <p className="text-sm text-gray-600">
                    Allow pacers to volunteer for multiple pace groups at once
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowMultiGroupVolunteering}
                  onChange={(e) => setSettings({ ...settings, allowMultiGroupVolunteering: e.target.checked })}
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
                  <p className="text-sm text-gray-600">
                    Automatically assign pacers based on their preferences
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoAssignPacers}
                  onChange={(e) => setSettings({ ...settings, autoAssignPacers: e.target.checked })}
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
                  <p className="text-sm text-gray-600">
                    Require admin approval for pacer assignments
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About Pace Groups</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Pace groups help organize runners by their target pace, ensuring everyone can find a comfortable group to run with.
            Each group can have designated pacers who help maintain the target pace and provide guidance during runs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Primary Pacers</h3>
              <p className="text-blue-700 text-sm">
                Primary pacers lead the pace group, maintain the target pace, and ensure the group stays together.
                They should have experience running at the designated pace and be familiar with the route.
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Shadow Pacers</h3>
              <p className="text-purple-700 text-sm">
                Shadow pacers assist the primary pacer, learn the ropes, and provide backup if needed.
                This role is perfect for members who want to develop their pacing skills before becoming primary pacers.
              </p>
            </div>
          </div>
          
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Tips for Effective Pace Groups</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>Create pace groups that cover a range of about 30 seconds (e.g., 6:00-6:30 min/km)</li>
              <li>Ensure each pace group has at least one experienced pacer</li>
              <li>Consider having both a front and back pacer for larger groups</li>
              <li>Provide pacers with visible identifiers (e.g., colored vests, armbands)</li>
              <li>Train new pacers by pairing them with experienced ones as shadow pacers</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default PacerSettings;