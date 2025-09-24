import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { goalTemplateService } from '../services/goalTemplateService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { 
  FiTarget, FiClock, FiTrendingUp, FiAward, FiActivity, FiHeart,
  FiMapPin, FiUsers, FiStar, FiChevronRight, FiX, FiPlus, FiCalendar
} = FiIcons;

function GoalTemplateSelector({ isOpen, onClose, onGoalCreated }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' or 'categories'
  const [loading, setLoading] = useState(true);
  const [customValues, setCustomValues] = useState({
    targetValue: '',
    targetDate: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const [categoriesData, popularData] = await Promise.all([
        goalTemplateService.getGoalCategories(),
        goalTemplateService.getPopularGoalTemplates()
      ]);
      
      setCategories(categoriesData);
      setPopularTemplates(popularData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setCustomValues({
      targetValue: template.defaultTargetValue || '',
      targetDate: '',
      title: template.name,
      description: template.description
    });
  };

  const handleCreateGoal = async () => {
    if (!selectedTemplate) return;

    if (!customValues.targetValue || !customValues.targetDate) {
      toast.error('Please fill in target value and date');
      return;
    }

    try {
      await goalTemplateService.createGoalFromTemplate(
        selectedTemplate.id,
        user.id,
        {
          targetValue: parseFloat(customValues.targetValue),
          targetDate: customValues.targetDate,
          title: customValues.title,
          description: customValues.description
        }
      );

      onGoalCreated();
      onClose();
      setSelectedTemplate(null);
      setCustomValues({ targetValue: '', targetDate: '', title: '', description: '' });
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      'target': FiTarget,
      'activity': FiActivity,
      'trending-up': FiTrendingUp,
      'heart': FiHeart,
      'users': FiUsers,
      'map-pin': FiMapPin,
      'award': FiAward,
      'clock': FiClock
    };
    return iconMap[iconName] || FiTarget;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Choose a Goal Template</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Template Selection */}
          <div className="flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 m-6 mb-4">
              <button
                onClick={() => setActiveTab('popular')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'popular' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <SafeIcon icon={FiStar} className="w-4 h-4" />
                  <span>Popular</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'categories' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <SafeIcon icon={FiTarget} className="w-4 h-4" />
                  <span>Categories</span>
                </div>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6 pt-0">
                {activeTab === 'popular' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Goals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {popularTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleSelectTemplate(template)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${template.category?.color || 'blue'}-100`}>
                              <SafeIcon 
                                icon={getCategoryIcon(template.category?.icon)} 
                                className={`w-5 h-5 text-${template.category?.color || 'blue'}-600`} 
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{template.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                                  {template.difficulty}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {template.usageCount} users
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    {categories.map((category) => (
                      <div key={category.id} className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${category.color}-100`}>
                            <SafeIcon 
                              icon={getCategoryIcon(category.icon)} 
                              className={`w-4 h-4 text-${category.color}-600`} 
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                          {category.templates.map((template) => (
                            <motion.div
                              key={template.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => handleSelectTemplate(template)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedTemplate?.id === template.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                                      {template.difficulty}
                                    </span>
                                    {template.isPopular && (
                                      <SafeIcon icon={FiStar} className="w-3 h-3 text-yellow-500" />
                                    )}
                                  </div>
                                </div>
                                <SafeIcon icon={FiChevronRight} className="w-4 h-4 text-gray-400" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal Customization Panel */}
          <AnimatePresence>
            {selectedTemplate && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-full lg:w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Customize Your Goal</h3>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                      <div className="flex items-center space-x-2 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                          {selectedTemplate.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedTemplate.estimatedDuration}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal Title
                      </label>
                      <input
                        type="text"
                        value={customValues.title}
                        onChange={(e) => setCustomValues({ ...customValues, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target {selectedTemplate.unit ? `(${selectedTemplate.unit})` : ''}
                      </label>
                      <input
                        type="number"
                        value={customValues.targetValue}
                        onChange={(e) => setCustomValues({ ...customValues, targetValue: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={selectedTemplate.defaultTargetValue}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={customValues.targetDate}
                        onChange={(e) => setCustomValues({ ...customValues, targetDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={customValues.description}
                        onChange={(e) => setCustomValues({ ...customValues, description: e.target.value })}
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {selectedTemplate.instructions && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-1">Instructions:</h5>
                        <p className="text-sm text-blue-800">{selectedTemplate.instructions}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateGoal}
                      disabled={!customValues.targetValue || !customValues.targetDate}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiPlus} className="w-4 h-4" />
                      <span>Create Goal</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default GoalTemplateSelector;