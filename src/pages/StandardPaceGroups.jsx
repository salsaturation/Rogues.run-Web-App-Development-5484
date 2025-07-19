import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import toast from 'react-hot-toast';

const {
  FiActivity, FiPlus, FiEdit, FiTrash2, FiSave, 
  FiX, FiArrowUp, FiArrowDown, FiClock, FiEye, 
  FiEyeOff, FiGrid, FiList, FiSearch, FiFilter
} = FiIcons;

function StandardPaceGroups() {
  const { user } = useAuth();
  const [paceGroups, setPaceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    minPace: 5.0,
    maxPace: 5.5,
    description: '',
    color: 'blue',
    icon: 'activity',
    displayOrder: 1,
    isActive: true
  });

  const colorOptions = [
    { value: 'blue', label: 'Blue', bg: 'bg-blue-100', text: 'text-blue-800' },
    { value: 'green', label: 'Green', bg: 'bg-green-100', text: 'text-green-800' },
    { value: 'red', label: 'Red', bg: 'bg-red-100', text: 'text-red-800' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-100', text: 'text-pink-800' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-100', text: 'text-teal-800' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-800' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-100', text: 'text-gray-800' }
  ];

  const iconOptions = [
    { value: 'activity', label: 'Activity', icon: FiActivity },
    { value: 'clock', label: 'Clock', icon: FiClock },
    { value: 'arrow-up', label: 'Arrow Up', icon: FiArrowUp },
    { value: 'arrow-down', label: 'Arrow Down', icon: FiArrowDown },
  ];

  useEffect(() => {
    loadPaceGroups();
  }, []);

  const loadPaceGroups = async () => {
    try {
      setLoading(true);
      const groups = await paceGroupService.getStandardPaceGroups();
      setPaceGroups(groups);
    } catch (error) {
      console.error('Failed to load standard pace groups:', error);
      toast.error('Failed to load standard pace groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaceGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await paceGroupService.updateStandardPaceGroup(editingGroup.id, formData);
        toast.success('Pace group updated successfully');
      } else {
        await paceGroupService.createStandardPaceGroup(formData, user?.id);
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
        toast.success('Pace group deleted successfully');
        loadPaceGroups();
      } catch (error) {
        console.error('Failed to delete pace group:', error);
        toast.error('Failed to delete pace group');
      }
    }
  };

  const handleEditPaceGroup = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      minPace: group.minPace,
      maxPace: group.maxPace,
      description: group.description || '',
      color: group.color || 'blue',
      icon: group.icon || 'activity',
      displayOrder: group.displayOrder || 1,
      isActive: group.isActive
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      minPace: 5.0,
      maxPace: 5.5,
      description: '',
      color: 'blue',
      icon: 'activity',
      displayOrder: paceGroups.length + 1,
      isActive: true
    });
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleToggleActive = async (groupId, currentStatus) => {
    try {
      await paceGroupService.updateStandardPaceGroup(groupId, { isActive: !currentStatus });
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to update pace group status:', error);
      toast.error('Failed to update pace group status');
    }
  };

  const filteredPaceGroups = paceGroups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActive = filterActive === 'all' ||
      (filterActive === 'active' && group.isActive) ||
      (filterActive === 'inactive' && !group.isActive);
    
    return matchesSearch && matchesActive;
  });

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiActivity} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can manage standard pace groups</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Standard Pace Groups</h1>
          <p className="text-gray-600">Manage standard pace groups for the community</p>
        </div>
        <button
          onClick={() => {
            setEditingGroup(null);
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Add Pace Group</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pace groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Groups</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <SafeIcon icon={FiGrid} className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <SafeIcon icon={FiList} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pace Groups Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaceGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 ${group.isActive ? `border-${group.color || 'blue'}-500` : 'border-gray-300'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorOptions.find(c => c.value === (group.color || 'blue')).bg}`}>
                    <SafeIcon 
                      icon={iconOptions.find(i => i.value === (group.icon || 'activity')).icon} 
                      className={`w-6 h-6 ${colorOptions.find(c => c.value === (group.color || 'blue')).text}`} 
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <SafeIcon icon={FiClock} className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/km
                      </span>
                    </div>
                  </div>
                </div>
                {!group.isActive && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              
              {group.description && (
                <p className="text-sm text-gray-600 mb-4">{group.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Display Order: {group.displayOrder}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(group.id, group.isActive)}
                    className={`p-2 rounded-lg transition-colors ${group.isActive ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-600 hover:bg-blue-50'}`}
                    title={group.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <SafeIcon icon={group.isActive ? FiEyeOff : FiEye} className="w-4 h-4" />
                  </button>
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pace Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPaceGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${colorOptions.find(c => c.value === (group.color || 'blue')).bg}`}>
                        <SafeIcon 
                          icon={iconOptions.find(i => i.value === (group.icon || 'activity')).icon}
                          className={`w-4 h-4 ${colorOptions.find(c => c.value === (group.color || 'blue')).text}`}
                        />
                      </div>
                      <span className="font-medium text-gray-900">{group.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{formatPace(group.minPace)} - {formatPace(group.maxPace)} min/km</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 truncate max-w-xs">{group.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{group.displayOrder}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggleActive(group.id, group.isActive)}
                        className={`p-1.5 rounded transition-colors ${group.isActive ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-600 hover:bg-blue-50'}`}
                        title={group.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <SafeIcon icon={group.isActive ? FiEyeOff : FiEye} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditPaceGroup(group)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit pace group"
                      >
                        <SafeIcon icon={FiEdit} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePaceGroup(group.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete pace group"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPaceGroups.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No pace groups found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGroup ? 'Edit Pace Group' : 'Create Pace Group'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <SafeIcon icon={FiX} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePaceGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Fast Group (5:00-5:30)"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Pace (min/km)</label>
                  <input
                    type="number"
                    value={formData.minPace}
                    onChange={(e) => setFormData({ ...formData, minPace: parseFloat(e.target.value) })}
                    step="0.1"
                    min="3"
                    max="15"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Pace (min/km)</label>
                  <input
                    type="number"
                    value={formData.maxPace}
                    onChange={(e) => setFormData({ ...formData, maxPace: parseFloat(e.target.value) })}
                    step="0.1"
                    min="3"
                    max="15"
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
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description of this pace group"
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
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>{color.label}</option>
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
                    {iconOptions.map((icon) => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center h-12 space-x-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={() => setFormData({ ...formData, isActive: true })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Active</span>
                    </label>
                    <label className="inline-flex items-center ml-6">
                      <input
                        type="radio"
                        name="isActive"
                        checked={!formData.isActive}
                        onChange={() => setFormData({ ...formData, isActive: false })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiSave} className="w-4 h-4" />
                  <span>{editingGroup ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About Standard Pace Groups</h2>
        <p className="text-gray-700 mb-4">
          Standard pace groups define the common pace ranges used across your running community. These groups can be:
        </p>
        <ul className="list-disc pl-5 text-gray-700 space-y-1 mb-4">
          <li>Used as templates when creating session pace groups</li>
          <li>Matched with user pace preferences to recommend suitable sessions</li>
          <li>Used to categorize and organize runners by ability</li>
          <li>Applied consistently across all running sessions</li>
        </ul>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Best Practices</h3>
          <ul className="list-disc pl-5 text-blue-700 space-y-1">
            <li>Create pace groups with approximately 30-second ranges (e.g., 5:00-5:30 min/km)</li>
            <li>Use consistent naming conventions across all pace groups</li>
            <li>Provide clear descriptions to help runners choose the right group</li>
            <li>Use different colors and icons to make groups easily distinguishable</li>
            <li>Order groups from fastest to slowest for consistent display</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StandardPaceGroups;