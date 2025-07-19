import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import { convertPace, DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';

const { FiUsers, FiClock, FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiActivity } = FiIcons;

function StandardPaceGroups() {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [paceGroups, setPaceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    minPace: '',
    maxPace: '',
    description: '',
    color: 'blue',
    icon: 'activity',
    displayOrder: 1,
    isActive: true
  });

  const iconOptions = [
    { value: 'activity', label: 'Activity' },
    { value: 'zap', label: 'Lightning' },
    { value: 'trending-up', label: 'Trending Up' },
    { value: 'heart', label: 'Heart' },
    { value: 'target', label: 'Target' },
    { value: 'clock', label: 'Clock' }
  ];

  const colorOptions = [
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'purple', label: 'Purple' },
    { value: 'red', label: 'Red' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'indigo', label: 'Indigo' }
  ];

  useEffect(() => {
    loadPaceGroups();
  }, []);

  const loadPaceGroups = async () => {
    try {
      setLoading(true);
      const data = await paceGroupService.getStandardPaceGroups();
      setPaceGroups(data);
    } catch (error) {
      console.error('Failed to load pace groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPace = (pace) => {
    if (!pace) return '0:00';
    
    // Convert from storage unit (km) to display unit if needed
    let displayPace = pace;
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      displayPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
    }
    
    const minutes = Math.floor(displayPace);
    const seconds = Math.round((displayPace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      minPace: '',
      maxPace: '',
      description: '',
      color: 'blue',
      icon: 'activity',
      displayOrder: 1,
      isActive: true
    });
  };

  const handleEditPaceGroup = (group) => {
    setEditingGroup(group);
    
    // Convert pace values from storage unit (km) to display unit if needed
    let minPaceForDisplay = group.minPace;
    let maxPaceForDisplay = group.maxPace;
    
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      minPaceForDisplay = convertPace(group.minPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
      maxPaceForDisplay = convertPace(group.maxPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
    }
    
    setFormData({
      name: group.name,
      minPace: minPaceForDisplay,
      maxPace: maxPaceForDisplay,
      description: group.description || '',
      color: group.color || 'blue',
      icon: group.icon || 'activity',
      displayOrder: group.displayOrder || 1,
      isActive: group.isActive
    });
    
    setShowForm(true);
  };

  const handleSavePaceGroup = async (e) => {
    e.preventDefault();
    try {
      // Convert pace values from display unit to storage unit (km) if user is using miles
      let minPaceForStorage = formData.minPace;
      let maxPaceForStorage = formData.maxPace;
      
      if (distanceUnit === DISTANCE_UNITS.MILES) {
        minPaceForStorage = convertPace(formData.minPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
        maxPaceForStorage = convertPace(formData.maxPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }
      
      const dataToSave = {
        ...formData,
        minPace: minPaceForStorage,
        maxPace: maxPaceForStorage
      };
      
      if (editingGroup) {
        await paceGroupService.updateStandardPaceGroup(editingGroup.id, dataToSave);
        toast.success('Pace group updated successfully');
      } else {
        await paceGroupService.createStandardPaceGroup(dataToSave, user?.id);
        toast.success('Pace group created successfully');
      }
      
      setShowForm(false);
      setEditingGroup(null);
      resetForm();
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to save pace group:', error);
      toast.error('Failed to save pace group');
    }
  };

  const handleDeletePaceGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this pace group?')) {
      try {
        await paceGroupService.deleteStandardPaceGroup(groupId);
        loadPaceGroups();
      } catch (error) {
        console.error('Failed to delete pace group:', error);
      }
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiUsers} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need admin privileges to manage pace groups</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Standard Pace Groups</h1>
          <p className="text-gray-600">Manage predefined pace groups for sessions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingGroup(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="w-5 h-5" />
          <span>Add Pace Group</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingGroup ? 'Edit Pace Group' : 'Create Pace Group'}
            </h2>
            
            <form onSubmit={handleSavePaceGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Pace (min/{distanceUnit})</label>
                  <input
                    type="number"
                    value={formData.minPace}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value);
                      setFormData({ ...formData, minPace: value });
                    }}
                    step="0.1"
                    min={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "3" : "5"}
                    max={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "15" : "24"}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Pace (min/{distanceUnit})</label>
                  <input
                    type="number"
                    value={formData.maxPace}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value);
                      setFormData({ ...formData, maxPace: value });
                    }}
                    step="0.1"
                    min={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "3" : "5"}
                    max={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "15" : "24"}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGroup(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Pace Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paceGroups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-${group.color}-100 rounded-lg flex items-center justify-center`}>
                  <SafeIcon icon={FiActivity} className={`w-5 h-5 text-${group.color}-600`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <SafeIcon icon={FiClock} className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/{distanceUnit}
                </span>
              </div>
              
              {group.description && (
                <p className="text-sm text-gray-600">{group.description}</p>
              )}
              
              <div className="text-xs text-gray-500">
                Display Order: {group.displayOrder}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditPaceGroup(group)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit pace group"
                >
                  <SafeIcon icon={FiEdit} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePaceGroup(group.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete pace group"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {paceGroups.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiUsers} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pace groups yet</h3>
          <p className="text-gray-500">Create your first pace group to get started</p>
        </div>
      )}
    </div>
  );
}

export default StandardPaceGroups;