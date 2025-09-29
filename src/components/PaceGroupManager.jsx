import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import { convertPace, formatPaceWithUnit, DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';

const { FiUsers, FiClock, FiPlus, FiCheck, FiX, FiUserPlus, FiEdit, FiTrash2, FiUserCheck, FiUserX, FiAlertCircle } = FiIcons;

function PaceGroupManager({ sessionId, paceGroups, onUpdate, readOnly = false }) {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [pacerSettings, setPacerSettings] = useState({
    pacerRoleTitle: 'Pacer',
    shadowRoleTitle: 'Shadow Pacer'
  });
  const [userPacerStatus, setUserPacerStatus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPacerSettings();
    if (user?.id) {
      loadUserPacerStatus();
    }
  }, [user?.id, sessionId]);

  const loadPacerSettings = async () => {
    try {
      const settings = await paceGroupService.getPacerSettings();
      setPacerSettings(settings);
    } catch (error) {
      console.error('Failed to load pacer settings:', error);
    }
  };

  const loadUserPacerStatus = async () => {
    try {
      const status = await paceGroupService.getUserPacerStatus(sessionId, user.id);
      setUserPacerStatus(status);
    } catch (error) {
      console.error('Failed to load user pacer status:', error);
    }
  };

  const formatPace = (pace) => {
    if (!pace) return '0:00';
    const convertedPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    const minutes = Math.floor(convertedPace);
    const seconds = Math.round((convertedPace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolunteerAsPacer = async (groupId, role = 'primary') => {
    if (!user?.id) {
      toast.error('You must be logged in to volunteer as a pacer');
      return;
    }

    try {
      setLoading(true);
      await paceGroupService.volunteerAsPacer(sessionId, groupId, user.id, role);
      toast.success(`Volunteered as ${role} pacer successfully!`);
      onUpdate();
      loadUserPacerStatus();
    } catch (error) {
      console.error('Failed to volunteer as pacer:', error);
      toast.error('Failed to volunteer as pacer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVolunteer = async (groupId) => {
    try {
      setLoading(true);
      await paceGroupService.cancelPacerVolunteer(sessionId, groupId, user.id);
      toast.success('Volunteer request cancelled');
      onUpdate();
      loadUserPacerStatus();
    } catch (error) {
      console.error('Failed to cancel volunteer request:', error);
      toast.error('Failed to cancel volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePacer = async (groupId, userId, role) => {
    if (!user?.isAdmin && !user?.canPublish) {
      toast.error('You need admin or publisher permissions to approve pacers');
      return;
    }

    try {
      setLoading(true);
      await paceGroupService.approvePacerVolunteer(sessionId, groupId, userId, role);
      toast.success('Pacer approved successfully');
      onUpdate();
    } catch (error) {
      console.error('Failed to approve pacer:', error);
      toast.error('Failed to approve pacer');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPacer = async (groupId, userId) => {
    if (!user?.isAdmin && !user?.canPublish) {
      toast.error('You need admin or publisher permissions to reject pacers');
      return;
    }

    try {
      setLoading(true);
      await paceGroupService.rejectPacerVolunteer(sessionId, groupId, userId);
      toast.success('Pacer volunteer rejected');
      onUpdate();
    } catch (error) {
      console.error('Failed to reject pacer:', error);
      toast.error('Failed to reject pacer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePacer = async (groupId, userId) => {
    if (!user?.isAdmin && !user?.canPublish) {
      toast.error('You need admin or publisher permissions to remove pacers');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this pacer?')) {
      return;
    }

    try {
      setLoading(true);
      await paceGroupService.removePacer(sessionId, groupId, userId);
      toast.success('Pacer removed successfully');
      onUpdate();
    } catch (error) {
      console.error('Failed to remove pacer:', error);
      toast.error('Failed to remove pacer');
    } finally {
      setLoading(false);
    }
  };

  const getUserPacerStatusForGroup = (groupId) => {
    return userPacerStatus[groupId] || { role: null, status: null };
  };

  const canManagePacers = user?.isAdmin || user?.canPublish;

  if (!paceGroups || paceGroups.length === 0) {
    return null;
  }

  const { pacerRoleTitle, shadowRoleTitle } = pacerSettings;

  return (
    <div className="space-y-6">
      {paceGroups.map((group, index) => {
        const userStatus = getUserPacerStatusForGroup(group.id);
        const isUserVolunteering = userStatus.status === 'pending' || userStatus.status === 'confirmed';
        
        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">
                  {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/{distanceUnit}
                </p>
                {group.description && (
                  <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <SafeIcon icon={FiUsers} className="w-4 h-4" />
                    <span>{group.pacers.length} / {group.requiredPacers} {pacerRoleTitle}s</span>
                  </div>
                  {group.shadowSlots > 0 && (
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiUserPlus} className="w-4 h-4" />
                      <span>{group.shadowPacers.length} / {group.shadowSlots} {shadowRoleTitle}s</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pacers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Pacers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{pacerRoleTitle}s</h4>
                  <div className="flex items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {group.pacers.length} / {group.requiredPacers}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {group.pacers.map((pacer, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {(pacer.userName || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{pacer.userName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pacer.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : pacer.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pacer.status}
                        </span>
                        {canManagePacers && pacer.status === 'confirmed' && (
                          <button
                            onClick={() => handleRemovePacer(group.id, pacer.userId)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Remove pacer"
                          >
                            <SafeIcon icon={FiX} className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Volunteer as Primary Pacer */}
                  {!readOnly && user && group.pacers.length < group.requiredPacers && (
                    <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded">
                      {!isUserVolunteering || userStatus.role !== 'primary' ? (
                        <>
                          <p className="text-sm text-gray-500 mb-2">
                            Need {group.requiredPacers - group.pacers.length} more {pacerRoleTitle.toLowerCase()}(s)
                          </p>
                          <button
                            onClick={() => handleVolunteerAsPacer(group.id, 'primary')}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Volunteering...' : `Volunteer as ${pacerRoleTitle}`}
                          </button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-2 text-sm">
                            <SafeIcon icon={FiClock} className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-700">
                              {userStatus.status === 'pending' ? 'Volunteer request pending' : 'You are a confirmed pacer'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCancelVolunteer(group.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Cancelling...' : 'Cancel Volunteer'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Shadow Pacers */}
              {group.shadowSlots > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{shadowRoleTitle}s</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {group.shadowPacers.length} / {group.shadowSlots}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.shadowPacers.map((pacer, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-600">
                              {(pacer.userName || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{pacer.userName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            pacer.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : pacer.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pacer.status}
                          </span>
                          {canManagePacers && pacer.status === 'confirmed' && (
                            <button
                              onClick={() => handleRemovePacer(group.id, pacer.userId)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Remove shadow pacer"
                            >
                              <SafeIcon icon={FiX} className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Volunteer as Shadow Pacer */}
                    {!readOnly && user && group.shadowPacers.length < group.shadowSlots && (
                      <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded">
                        {!isUserVolunteering || userStatus.role !== 'shadow' ? (
                          <>
                            <p className="text-sm text-gray-500 mb-2">
                              Need {group.shadowSlots - group.shadowPacers.length} more {shadowRoleTitle.toLowerCase()}(s)
                            </p>
                            <button
                              onClick={() => handleVolunteerAsPacer(group.id, 'shadow')}
                              disabled={loading}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors disabled:opacity-50"
                            >
                              {loading ? 'Volunteering...' : `Volunteer as ${shadowRoleTitle}`}
                            </button>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center space-x-2 text-sm">
                              <SafeIcon icon={FiClock} className="w-4 h-4 text-yellow-600" />
                              <span className="text-yellow-700">
                                {userStatus.status === 'pending' ? 'Volunteer request pending' : 'You are a confirmed shadow pacer'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCancelVolunteer(group.id)}
                              disabled={loading}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              {loading ? 'Cancelling...' : 'Cancel Volunteer'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pending Volunteers */}
            {group.pendingVolunteers && group.pendingVolunteers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Pending Volunteers</h4>
                <div className="space-y-2">
                  {group.pendingVolunteers.map((volunteer, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-yellow-600">
                            {(volunteer.userName || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">{volunteer.userName}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({volunteer.preferredRole} {volunteer.preferredRole === 'primary' ? pacerRoleTitle : shadowRoleTitle})
                          </span>
                        </div>
                      </div>
                      {canManagePacers && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprovePacer(group.id, volunteer.userId, volunteer.preferredRole)}
                            disabled={loading}
                            className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Approve volunteer"
                          >
                            <SafeIcon icon={FiCheck} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRejectPacer(group.id, volunteer.userId)}
                            disabled={loading}
                            className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject volunteer"
                          >
                            <SafeIcon icon={FiX} className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Status Info */}
            {!readOnly && user && isUserVolunteering && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiAlertCircle} className="w-4 h-4 text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">
                      You've volunteered as a {userStatus.role} {userStatus.role === 'primary' ? pacerRoleTitle : shadowRoleTitle}
                    </span>
                    <p className="text-blue-700 mt-1">
                      {userStatus.status === 'pending' 
                        ? 'Your volunteer request is pending admin approval.'
                        : 'You are confirmed as a pacer for this group.'
                      }
                      {userStatus.status === 'pending' && ' You will be automatically registered for this session once approved.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default PaceGroupManager;