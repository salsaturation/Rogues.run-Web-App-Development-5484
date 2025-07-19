import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import { convertPace, formatPaceWithUnit, DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';

const { FiUsers, FiClock, FiPlus, FiCheck, FiX, FiUserPlus, FiEdit, FiTrash2 } = FiIcons;

function PaceGroupManager({ sessionId, paceGroups, onUpdate, readOnly = false }) {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [pacerSettings, setPacerSettings] = useState({
    pacerRoleTitle: 'Pacer',
    shadowRoleTitle: 'Shadow Pacer'
  });
  const [userPacerStatus, setUserPacerStatus] = useState({
    isVolunteering: false,
    preferredGroups: [],
    preferredRoles: [],
    status: 'none'
  });

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
    try {
      await paceGroupService.volunteerAsPacer(sessionId, groupId, user.id, role);
      toast.success(`Volunteered as ${role} pacer successfully!`);
      onUpdate();
      loadUserPacerStatus();
    } catch (error) {
      console.error('Failed to volunteer as pacer:', error);
    }
  };

  const handleCancelVolunteer = async (groupId) => {
    try {
      await paceGroupService.cancelPacerVolunteer(sessionId, groupId, user.id);
      toast.success('Volunteer request cancelled');
      onUpdate();
      loadUserPacerStatus();
    } catch (error) {
      console.error('Failed to cancel volunteer request:', error);
    }
  };

  if (!paceGroups || paceGroups.length === 0) {
    return null;
  }

  const { pacerRoleTitle, shadowRoleTitle } = pacerSettings;

  return (
    <div className="space-y-6">
      {paceGroups.map((group, index) => (
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
                  <span className="text-xs text-gray-500 ml-2">min/{distanceUnit}</span>
                </div>
              </div>
              <div className="space-y-2">
                {group.pacers.map((pacer, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm font-medium">{pacer.userName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pacer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      pacer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pacer.status}
                    </span>
                  </div>
                ))}
                {group.pacers.length < group.requiredPacers && (
                  <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded">
                    <p className="text-sm text-gray-500">Need {group.requiredPacers - group.pacers.length} more {pacerRoleTitle.toLowerCase()}(s)</p>
                    {!readOnly && user && (
                      <button
                        onClick={() => handleVolunteerAsPacer(group.id, 'primary')}
                        className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                      >
                        Volunteer as {pacerRoleTitle}
                      </button>
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
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">{pacer.userName}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pacer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        pacer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pacer.status}
                      </span>
                    </div>
                  ))}
                  {group.shadowPacers.length < group.shadowSlots && (
                    <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded">
                      <p className="text-sm text-gray-500">Need {group.shadowSlots - group.shadowPacers.length} more {shadowRoleTitle.toLowerCase()}(s)</p>
                      {!readOnly && user && (
                        <button
                          onClick={() => handleVolunteerAsPacer(group.id, 'shadow')}
                          className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                        >
                          Volunteer as {shadowRoleTitle}
                        </button>
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
                  <div key={i} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{volunteer.userName}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({volunteer.preferredRole} {volunteer.preferredRole === 'primary' ? pacerRoleTitle : shadowRoleTitle})
                      </span>
                    </div>
                    {!readOnly && user?.isAdmin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => paceGroupService.approvePacerVolunteer(sessionId, group.id, volunteer.userId, volunteer.preferredRole)}
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          <SafeIcon icon={FiCheck} className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => paceGroupService.rejectPacerVolunteer(sessionId, group.id, volunteer.userId)}
                          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
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
        </motion.div>
      ))}
    </div>
  );
}

export default PaceGroupManager;