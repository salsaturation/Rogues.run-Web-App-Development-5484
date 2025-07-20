import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { templateService } from '../services/templateService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { 
  FiX, FiSave, FiSearch, FiTag, FiUsers, FiClock, 
  FiActivity, FiStar, FiEye, FiLock, FiGlobe 
} = FiIcons;

function SessionTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
  mode = 'select' // 'select' or 'save'
}) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'public', 'mine', 'popular'

  // For save mode
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [templateTags, setTemplateTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const availableTags = [
    'morning', 'evening', 'weekend', 'easy', 'tempo', 
    'interval', 'long-run', 'hills', 'track', 'trail',
    'beginner-friendly', 'advanced', 'strength', 'endurance',
    'speed', 'recovery', 'multi-distance', 'structured'
  ];

  useEffect(() => {
    if (isOpen && mode === 'select') {
      loadTemplates();
    }
  }, [isOpen, mode, activeTab]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let data;
      
      switch (activeTab) {
        case 'popular':
          data = await templateService.getPopularTemplates(10);
          break;
        case 'mine':
          data = await templateService.getTemplates(user?.id);
          data = data.filter(t => t.createdBy === user?.id);
          break;
        case 'public':
          data = await templateService.getTemplates();
          data = data.filter(t => t.isPublic);
          break;
        default:
          data = await templateService.getTemplates(user?.id);
      }
      
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await templateService.searchTemplates(
        searchQuery,
        selectedTags,
        user?.id
      );
      setTemplates(data);
    } catch (error) {
      console.error('Failed to search templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !templateTags.includes(newTag.trim())) {
      setTemplateTags([...templateTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTemplateTags(templateTags.filter(tag => tag !== tagToRemove));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => template.tags.includes(tag));
      
    return matchesSearch && matchesTags;
  });

  const formatPace = (pace) => {
    if (!pace) return 'N/A';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'save' ? 'Save Session as Template' : 'Choose Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'select' ? (
            <>
              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200">
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
                  {[
                    { id: 'all', label: 'All Templates' },
                    { id: 'popular', label: 'Popular' },
                    { id: 'public', label: 'Public' },
                    { id: 'mine', label: 'My Templates' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id ? 
                          'bg-white text-blue-600 shadow-sm' : 
                          'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <SafeIcon 
                      icon={FiSearch} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                    />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                </div>

                {/* Tags Filter */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedTags.includes(tag) ? 
                            'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Templates List */}
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onSelectTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {template.description || 'No description'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {template.isPublic ? (
                              <SafeIcon icon={FiGlobe} className="w-4 h-4 text-green-600" title="Public template" />
                            ) : (
                              <SafeIcon icon={FiLock} className="w-4 h-4 text-gray-400" title="Private template" />
                            )}
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <SafeIcon icon={FiEye} className="w-3 h-3" />
                              <span>{template.usageCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Template Details */}
                        {template.templateData && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <div className="flex items-center space-x-1">
                                <SafeIcon icon={FiClock} className="w-3 h-3" />
                                <span>{template.templateData.time || 'No time'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <SafeIcon icon={FiUsers} className="w-3 h-3" />
                                <span>{template.templateData.maxAttendees || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <SafeIcon icon={FiActivity} className="w-3 h-3" />
                                <span>{template.templateData.totalDistance || 0}km</span>
                              </div>
                            </div>

                            {template.templateData.runType && (
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(template.templateData.runType)}`}>
                                  {template.templateData.runType}
                                </span>
                                {template.templateData.paceMin && template.templateData.paceMax && (
                                  <span className="text-xs text-gray-600">
                                    {formatPace(template.templateData.paceMin)} - {formatPace(template.templateData.paceMax)} min/km
                                  </span>
                                )}
                              </div>
                            )}

                            {template.templateData.paceGroups && template.templateData.paceGroups.length > 0 && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">{template.templateData.paceGroups.length} pace groups</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Creator */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Created by {template.creator?.name || 'Unknown'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <SafeIcon icon={FiSearch} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Save Mode */
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Morning Easy Run Template"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what makes this template useful..."
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Make Public</p>
                    <p className="text-sm text-gray-600">Allow other users to use this template</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <SafeIcon icon={FiTag} className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Current Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {templateTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="w-4 h-4 flex items-center justify-center text-blue-700 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Suggested Tags */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => !templateTags.includes(tag))
                        .slice(0, 8)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setTemplateTags([...templateTags, tag])}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'save' && (
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (templateName.trim()) {
                  const templateData = {
                    name: templateName,
                    description: templateDescription,
                    isPublic: isPublic,
                    tags: templateTags
                  };
                  onSelectTemplate(templateData);
                }
              }}
              disabled={!templateName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SessionTemplateModal;