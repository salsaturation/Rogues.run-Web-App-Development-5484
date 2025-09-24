import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAuth} from '../contexts/AuthContext';
import {useSettings} from '../contexts/SettingsContext';
import {templateService} from '../services/templateService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import SessionTemplateModal from '../components/SessionTemplateModal';
import {formatPaceWithUnit, convertPace, DISTANCE_UNITS} from '../utils/unitConversion';
import toast from 'react-hot-toast';

const {FiSave, FiPlus, FiEdit, FiTrash2, FiEye, FiGlobe, FiLock, FiUsers, FiClock, FiActivity, FiSearch, FiFilter} = FiIcons;

function Templates() {
  const {user} = useAuth();
  const {distanceUnit} = useSettings();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'mine', 'public'
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalMode, setModalMode] = useState('select'); // 'select', 'edit'

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates(user?.id);
      console.log('Loaded templates:', data);
      console.log('Current user ID:', user?.id);
      console.log('Current user email:', user?.email);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    console.log('Editing template:', template);
    setSelectedTemplate(template);
    setModalMode('edit');
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await templateService.deleteTemplate(template.id, user.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCreateFromTemplate = (template) => {
    // Navigate to sessions page with template data
    const templateParams = new URLSearchParams({
      template: template.id,
      name: template.name
    });
    window.location.href = `#/sessions?${templateParams.toString()}`;
  };

  const handleTemplateModalClose = () => {
    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setModalMode('select');
  };

  const handleTemplateUpdate = (updatedTemplate) => {
    console.log('Template updated:', updatedTemplate);
    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setModalMode('select');
    loadTemplates();
  };

  // Helper function to check if user owns template
  const isUserTemplate = (template) => {
    if (!user) return false;
    
    // Check if user ID matches created_by
    if (user.id && template.createdBy === user.id) {
      return true;
    }
    
    // Check if user email matches creator email
    if (user.email && template.creator?.email === user.email) {
      return true;
    }
    
    console.log('Ownership check for', template.name, ':', {
      userOwns: false,
      templateCreatedBy: template.createdBy,
      templateCreatorEmail: template.creator?.email,
      userId: user?.id,
      userEmail: user?.email
    });
    
    return false;
  };

  // Fixed filtering logic
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    
    if (filterType === 'mine') {
      // Use the helper function to check ownership
      matchesFilter = isUserTemplate(template);
    } else if (filterType === 'public') {
      matchesFilter = template.isPublic === true;
    }
    // filterType === 'all' shows everything, so no additional filter needed
    
    console.log('Filter result for', template.name, ':', {
      matchesSearch, 
      matchesFilter, 
      filterType,
      isUserTemplate: isUserTemplate(template)
    });
    
    return matchesSearch && matchesFilter;
  });

  // Helper function to check if user can edit template
  const canEditTemplate = (template) => {
    // User can edit if they own the template or are admin
    const isOwner = isUserTemplate(template);
    const isAdmin = user?.isAdmin;
    
    console.log('Can edit check for', template.name, ':', {
      isOwner,
      isAdmin,
      canEdit: isOwner || isAdmin
    });
    
    return isOwner || isAdmin;
  };

  const formatPace = (pace) => {
    if (!pace) return 'N/A';
    
    // Convert from storage unit (km) to display unit if needed
    let displayPace = pace;
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      displayPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
    }
    
    return formatPaceWithUnit(displayPace, distanceUnit);
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

  if (!user?.canPublish && !user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiSave} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need publisher or admin privileges to manage templates</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Templates</h1>
          <p className="text-gray-600">Manage reusable session templates</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {filteredTemplates.length} of {templates.length} templates
          </span>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Total templates:</strong> {templates.length}</p>
            <p><strong>Filtered templates:</strong> {filteredTemplates.length}</p>
            <p><strong>Current filter:</strong> {filterType}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>User Email:</strong> {user?.email}</p>
            <p><strong>My templates count:</strong> {templates.filter(t => isUserTemplate(t)).length}</p>
            <p><strong>Template details:</strong></p>
            <ul className="ml-4">
              {templates.slice(0, 3).map(t => (
                <li key={t.id}>
                  {t.name} - Created by: {t.createdBy} ({t.creator?.email}) - Is mine: {isUserTemplate(t) ? 'Yes' : 'No'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Templates</option>
              <option value="mine">My Templates ({templates.filter(t => isUserTemplate(t)).length})</option>
              <option value="public">Public Templates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: index * 0.1}}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.isPublic ? (
                    <SafeIcon icon={FiGlobe} className="w-4 h-4 text-green-600" title="Public template" />
                  ) : (
                    <SafeIcon icon={FiLock} className="w-4 h-4 text-gray-400" title="Private template" />
                  )}
                  {isUserTemplate(template) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      Mine
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {template.description || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Template Details */}
            {template.templateData && (
              <div className="space-y-2 mb-4">
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
                        {formatPace(template.templateData.paceMin)} - {formatPace(template.templateData.paceMax)}
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
              <div className="flex flex-wrap gap-1 mb-4">
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

            {/* Usage Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiEye} className="w-3 h-3" />
                <span>Used {template.usageCount || 0} times</span>
              </div>
              <span>
                By {template.creator?.name || 'Unknown'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => handleCreateFromTemplate(template)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                Use Template
              </button>

              {/* Edit/Delete buttons - only show for template owners */}
              {canEditTemplate(template) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit template"
                  >
                    <SafeIcon icon={FiEdit} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete template"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <SafeIcon icon={FiSave} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterType !== 'all' ? 
              'Try adjusting your search or filters' : 
              'Create your first template by saving a session as a template'
            }
          </p>
          {filterType === 'mine' && templates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You have {templates.filter(t => isUserTemplate(t)).length} templates. 
                {templates.filter(t => isUserTemplate(t)).length === 0 ? 
                  ' You can create templates by saving sessions as templates from the Sessions page.' :
                  ' Switch to "All Templates" to see all available templates.'
                }
              </p>
            </div>
          )}
          <button
            onClick={() => window.location.href = '#/sessions'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Sessions
          </button>
        </div>
      )}

      {/* Template Modal for editing */}
      {showTemplateModal && (
        <SessionTemplateModal
          isOpen={showTemplateModal}
          onClose={handleTemplateModalClose}
          onSelectTemplate={handleTemplateUpdate}
          mode={modalMode}
          initialTemplate={selectedTemplate}
        />
      )}
    </div>
  );
}

export default Templates;