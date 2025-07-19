import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import { paceGroupService } from '../services/paceGroupService';
import toast from 'react-hot-toast';

const { 
  FiUsers, FiClock, FiStar, FiCheckCircle, FiActivity, 
  FiPlus, FiEdit, FiTrash2, FiUserCheck, FiUserX, FiUserPlus,
  FiUser // Add this missing icon import
} = FiIcons;

function PaceGroupManager({ sessionId, sessionDate, isPastSession = false, canManage = false }) {
  const { user } = useAuth();
  const [paceGroups, setPaceGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [pacerRoleTitle, setPacerRoleTitle] = useState('Pacer');
  const [shadowRoleTitle, setShadowRoleTitle] = useState('Shadow Pacer');
  const [settings, setSettings] = useState({
    allowMultiGroupVolunteering: true,
    autoAssignPacers: true,
    requireApproval: true
  });
  
  // Form state for adding/editing pace groups
  const [formData, setFormData] = useState({
    name: '',
    minPace: 6.0,
    maxPace: 6.5,
    requiredPacers: 1,
    shadowSlots: 1,
    description: ''
  });

  // User's volunteer status
  const [userVolunteerStatus, setUserVolunteerStatus] = useState({
    isVolunteering: false,
    preferredGroups: [],
    preferredRoles: [],
    status: 'none' // none, pending, confirmed, rejected
  });

  useEffect(() => {
    loadPaceGroups();
    loadPacerSettings();
  }, [sessionId]);

  const loadPaceGroups = async () => {
    try {
      setIsLoading(true);
      const groups = await paceGroupService.getPaceGroupsBySessionId(sessionId);
      setPaceGroups(groups);
      
      // Check user's volunteer status if logged in
      if (user && user.id) {
        const status = await paceGroupService.getUserPacerStatus(sessionId, user.id);
        setUserVolunteerStatus(status);
      }
    } catch (error) {
      console.error('Failed to load pace groups:', error);
      toast.error('Failed to load pace groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPacerSettings = async () => {
    try {
      const settings = await paceGroupService.getPacerSettings();
      setPacerRoleTitle(settings.pacerRoleTitle || 'Pacer');
      setShadowRoleTitle(settings.shadowRoleTitle || 'Shadow Pacer');
      setSettings({
        allowMultiGroupVolunteering: settings.allowMultiGroupVolunteering !== false,
        autoAssignPacers: settings.autoAssignPacers !== false,
        requireApproval: settings.requireApproval !== false
      });
    } catch (error) {
      console.error('Failed to load pacer settings:', error);
    }
  };

  const handleSaveGroup = async () => {
    try {
      if (editingGroup) {
        await paceGroupService.updatePaceGroup(editingGroup.id, {
          ...formData,
          sessionId
        });
        toast.success('Pace group updated');
      } else {
        await paceGroupService.createPaceGroup({
          ...formData,
          sessionId
        });
        toast.success('Pace group added');
      }
      
      setShowAddForm(false);
      setEditingGroup(null);
      resetForm();
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to save pace group:', error);
      toast.error('Failed to save pace group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this pace group?')) {
      try {
        await paceGroupService.deletePaceGroup(groupId);
        toast.success('Pace group deleted');
        loadPaceGroups();
      } catch (error) {
        console.error('Failed to delete pace group:', error);
        toast.error('Failed to delete pace group');
      }
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      minPace: group.minPace,
      maxPace: group.maxPace,
      requiredPacers: group.requiredPacers,
      shadowSlots: group.shadowSlots,
      description: group.description || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      minPace: 6.0,
      maxPace: 6.5,
      requiredPacers: 1,
      shadowSlots: 1,
      description: ''
    });
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolunteer = async (groupId, role = 'primary') => {
    try {
      if (!user || !user.id) {
        toast.error('You must be logged in to volunteer as a pacer');
        return;
      }

      await paceGroupService.volunteerAsPacer(sessionId, groupId, user.id, role);
      toast.success('Successfully volunteered as a pacer');
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to volunteer as pacer:', error);
      toast.error('Failed to volunteer as pacer');
    }
  };

  const handleCancelVolunteer = async (groupId) => {
    try {
      if (!user || !user.id) return;

      await paceGroupService.cancelPacerVolunteer(sessionId, groupId, user.id);
      toast.success('Volunteer request cancelled');
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to cancel volunteer request:', error);
      toast.error('Failed to cancel volunteer request');
    }
  };

  const handleApproveVolunteer = async (groupId, userId, role) => {
    try {
      await paceGroupService.approvePacerVolunteer(sessionId, groupId, userId, role);
      toast.success('Volunteer approved');
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to approve volunteer:', error);
      toast.error('Failed to approve volunteer');
    }
  };

  const handleRejectVolunteer = async (groupId, userId) => {
    try {
      await paceGroupService.rejectPacerVolunteer(sessionId, groupId, userId);
      toast.success('Volunteer rejected');
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to reject volunteer:', error);
      toast.error('Failed to reject volunteer');
    }
  };

  const handleMultiGroupVolunteer = () => {
    // Open the multi-group volunteer modal
    setShowMultiGroupModal(true);
  };

  const [showMultiGroupModal, setShowMultiGroupModal] = useState(false);
  const [multiGroupSelection, setMultiGroupSelection] = useState({
    groups: [],
    preferredRoles: ['primary', 'shadow'],
    notes: ''
  });

  const handleSubmitMultiGroupVolunteer = async () => {
    try {
      if (!user || !user.id) {
        toast.error('You must be logged in to volunteer as a pacer');
        return;
      }

      if (multiGroupSelection.groups.length === 0) {
        toast.error('Please select at least one pace group');
        return;
      }

      await paceGroupService.volunteerForMultipleGroups(
        sessionId, 
        user.id, 
        multiGroupSelection.groups,
        multiGroupSelection.preferredRoles,
        multiGroupSelection.notes
      );
      
      toast.success('Successfully submitted pacer volunteer request');
      setShowMultiGroupModal(false);
      loadPaceGroups();
    } catch (error) {
      console.error('Failed to submit multi-group volunteer request:', error);
      toast.error('Failed to submit volunteer request');
    }
  };

  const isUserAssignedToPaceGroup = (group) => {
    return group.pacers.some(pacer => 
      pacer.userId === user?.id && 
      (pacer.status === 'confirmed' || pacer.status === 'tentative')
    ) || group.shadowPacers.some(pacer => 
      pacer.userId === user?.id && 
      (pacer.status === 'confirmed' || pacer.status === 'tentative')
    );
  };

  const isUserPendingForPaceGroup = (group) => {
    return group.pendingVolunteers.some(volunteer => 
      volunteer.userId === user?.id
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Pace Groups</h2>
        <div className="flex space-x-2">
          {canManage && (
            <button
              onClick={() => { setShowAddForm(true); setEditingGroup(null); resetForm(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
              <span>Add Pace Group</span>
            </button>
          )}
          {settings.allowMultiGroupVolunteering && !isPastSession && user && (
            <button
              onClick={handleMultiGroupVolunteer}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiUserPlus} className="w-4 h-4" />
              <span>Volunteer as {pacerRoleTitle}</span>
            </button>
          )}
        </div>
      </div>

      {paceGroups.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <SafeIcon icon={FiClock} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pace groups yet</h3>
          {canManage ? (
            <p className="text-gray-500">Create pace groups to help organize participants</p>
          ) : (
            <p className="text-gray-500">The organizer has not set up pace groups for this session</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paceGroups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                  {canManage && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="p-1 hover:bg-blue-50 rounded-md text-blue-600"
                      >
                        <SafeIcon icon={FiEdit} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1 hover:bg-red-50 rounded-md text-red-600"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <SafeIcon icon={FiClock} className="w-4 h-4" />
                  <span>
                    {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/km
                  </span>
                </div>
                {group.description && (
                  <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                )}
              </div>
              
              {/* Pacers Section */}
              <div className="p-4 bg-gray-50">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{pacerRoleTitle}s</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {group.pacers.length} / {group.requiredPacers}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {group.pacers.map((pacer) => (
                      <div key={pacer.userId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <SafeIcon icon={FiUser} className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="font-medium">{pacer.userName || 'User'}</span>
                          {pacer.status === 'tentative' && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                              Tentative
                            </span>
                          )}
                        </div>
                        {canManage && pacer.status === 'tentative' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleApproveVolunteer(group.id, pacer.userId, 'primary')}
                              className="p-1 hover:bg-green-50 rounded-md text-green-600"
                              title="Approve"
                            >
                              <SafeIcon icon={FiCheckCircle} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectVolunteer(group.id, pacer.userId)}
                              className="p-1 hover:bg-red-50 rounded-md text-red-600"
                              title="Reject"
                            >
                              <SafeIcon icon={FiUserX} className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {group.pacers.length < group.requiredPacers && (
                      <div className="text-sm text-gray-500 italic">
                        {group.requiredPacers - group.pacers.length} more {pacerRoleTitle}{group.requiredPacers - group.pacers.length > 1 ? 's' : ''} needed
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Shadow Pacers Section */}
                {group.shadowSlots > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{shadowRoleTitle}s</h4>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {group.shadowPacers.length} / {group.shadowSlots}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {group.shadowPacers.map((pacer) => (
                        <div key={pacer.userId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <SafeIcon icon={FiUser} className="w-3 h-3 text-purple-600" />
                            </div>
                            <span className="font-medium">{pacer.userName || 'User'}</span>
                            {pacer.status === 'tentative' && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                Tentative
                              </span>
                            )}
                          </div>
                          {canManage && pacer.status === 'tentative' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleApproveVolunteer(group.id, pacer.userId, 'shadow')}
                                className="p-1 hover:bg-green-50 rounded-md text-green-600"
                                title="Approve"
                              >
                                <SafeIcon icon={FiCheckCircle} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectVolunteer(group.id, pacer.userId)}
                                className="p-1 hover:bg-red-50 rounded-md text-red-600"
                                title="Reject"
                              >
                                <SafeIcon icon={FiUserX} className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {group.shadowPacers.length < group.shadowSlots && (
                        <div className="text-sm text-gray-500 italic">
                          {group.shadowSlots - group.shadowPacers.length} more {shadowRoleTitle}{group.shadowSlots - group.shadowPacers.length > 1 ? 's' : ''} needed
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending Volunteers */}
                {canManage && group.pendingVolunteers && group.pendingVolunteers.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Pending Volunteers</h4>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {group.pendingVolunteers.length}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {group.pendingVolunteers.map((volunteer) => (
                        <div key={volunteer.userId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                              <SafeIcon icon={FiUser} className="w-3 h-3 text-yellow-600" />
                            </div>
                            <span className="font-medium">{volunteer.userName || 'User'}</span>
                            <span className="text-xs text-gray-500">
                              ({volunteer.preferredRole === 'primary' ? pacerRoleTitle : shadowRoleTitle})
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleApproveVolunteer(group.id, volunteer.userId, volunteer.preferredRole)}
                              className="p-1 hover:bg-green-50 rounded-md text-green-600"
                              title="Approve"
                            >
                              <SafeIcon icon={FiCheckCircle} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectVolunteer(group.id, volunteer.userId)}
                              className="p-1 hover:bg-red-50 rounded-md text-red-600"
                              title="Reject"
                            >
                              <SafeIcon icon={FiUserX} className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volunteer Actions */}
                {!isPastSession && user && !canManage && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {isUserAssignedToPaceGroup(group) ? (
                      <button
                        onClick={() => handleCancelVolunteer(group.id)}
                        className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        Cancel {pacerRoleTitle} Role
                      </button>
                    ) : isUserPendingForPaceGroup(group) ? (
                      <button
                        onClick={() => handleCancelVolunteer(group.id)}
                        className="w-full py-2 px-4 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                      >
                        Cancel Volunteer Request
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        {group.pacers.length < group.requiredPacers && (
                          <button
                            onClick={() => handleVolunteer(group.id, 'primary')}
                            className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            Volunteer as {pacerRoleTitle}
                          </button>
                        )}
                        {group.shadowPacers.length < group.shadowSlots && (
                          <button
                            onClick={() => handleVolunteer(group.id, 'shadow')}
                            className="flex-1 py-2 px-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                          >
                            Volunteer as {shadowRoleTitle}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Pace Group Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingGroup ? 'Edit Pace Group' : 'Add Pace Group'}
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveGroup(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 6:00-6:30 Pace Group"
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required {pacerRoleTitle}s</label>
                  <input
                    type="number"
                    value={formData.requiredPacers}
                    onChange={(e) => setFormData({ ...formData, requiredPacers: parseInt(e.target.value) })}
                    min="0"
                    max="10"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{shadowRoleTitle} Slots</label>
                  <input
                    type="number"
                    value={formData.shadowSlots}
                    onChange={(e) => setFormData({ ...formData, shadowSlots: parseInt(e.target.value) })}
                    min="0"
                    max="10"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional details about this pace group"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingGroup ? 'Update Group' : 'Add Group'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Multi-Group Volunteer Modal */}
      {showMultiGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Volunteer as {pacerRoleTitle}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitMultiGroupVolunteer(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Pace Group(s)</label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {paceGroups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={multiGroupSelection.groups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMultiGroupSelection({
                              ...multiGroupSelection,
                              groups: [...multiGroupSelection.groups, group.id]
                            });
                          } else {
                            setMultiGroupSelection({
                              ...multiGroupSelection,
                              groups: multiGroupSelection.groups.filter(id => id !== group.id)
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/km
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Role(s)</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={multiGroupSelection.preferredRoles.includes('primary')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMultiGroupSelection({
                            ...multiGroupSelection,
                            preferredRoles: [...multiGroupSelection.preferredRoles, 'primary']
                          });
                        } else {
                          setMultiGroupSelection({
                            ...multiGroupSelection,
                            preferredRoles: multiGroupSelection.preferredRoles.filter(role => role !== 'primary')
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>{pacerRoleTitle}</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={multiGroupSelection.preferredRoles.includes('shadow')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMultiGroupSelection({
                            ...multiGroupSelection,
                            preferredRoles: [...multiGroupSelection.preferredRoles, 'shadow']
                          });
                        } else {
                          setMultiGroupSelection({
                            ...multiGroupSelection,
                            preferredRoles: multiGroupSelection.preferredRoles.filter(role => role !== 'shadow')
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>{shadowRoleTitle}</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={multiGroupSelection.notes}
                  onChange={(e) => setMultiGroupSelection({ ...multiGroupSelection, notes: e.target.value })}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional information for the organizer"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMultiGroupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={multiGroupSelection.groups.length === 0 || multiGroupSelection.preferredRoles.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default PaceGroupManager;