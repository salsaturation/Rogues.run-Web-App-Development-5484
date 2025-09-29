import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import { memberService } from '../services/memberService';
import { convertPace, formatPaceWithUnit, DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';

const { FiUsers, FiUserPlus, FiUserCheck, FiX, FiPlus, FiSearch } = FiIcons;

function AdminPacerManager({ sessionId, paceGroups, onUpdate }) {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedRole, setSelectedRole] = useState('primary');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await memberService.getMembers();
      // Only show approved members
      setMembers(data.filter(m => m.isApproved));
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleAssignPacer = async (memberId, groupId, role) => {
    try {
      setLoading(true);
      await paceGroupService.assignPacer(sessionId, groupId, memberId, role);
      toast.success('Pacer assigned successfully');
      onUpdate();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Failed to assign pacer:', error);
      toast.error('Failed to assign pacer');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPace = (pace) => {
    if (!pace) return '0:00';
    const convertedPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    const minutes = Math.floor(convertedPace);
    const seconds = Math.round((convertedPace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!user?.isAdmin && !user?.canPublish) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Admin Actions Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Admin Pacer Management</h3>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiUserPlus} className="w-4 h-4" />
          <span>Assign Pacer</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paceGroups.map((group) => {
          const totalPacersNeeded = group.requiredPacers + group.shadowSlots;
          const totalPacersAssigned = group.pacers.length + group.shadowPacers.length;
          const needsMorePacers = totalPacersAssigned < totalPacersNeeded;

          return (
            <div
              key={group.id}
              className={`p-4 rounded-lg border-2 ${
                needsMorePacers ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'
              }`}
            >
              <h4 className="font-medium text-gray-900">{group.name}</h4>
              <p className="text-sm text-gray-600 mb-2">
                {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/{distanceUnit}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {totalPacersAssigned} / {totalPacersNeeded} pacers
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  needsMorePacers ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {needsMorePacers ? 'Needs Pacers' : 'Fully Staffed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Pacer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Assign Pacer</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <SafeIcon icon={FiX} className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pace Group Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pace Group
                </label>
                <select
                  value={selectedGroup || ''}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a pace group...</option>
                  {paceGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({formatPace(group.minPace)}-{formatPace(group.maxPace)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRole('primary')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedRole === 'primary'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pacer
                  </button>
                  <button
                    onClick={() => setSelectedRole('shadow')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedRole === 'shadow'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Shadow Pacer
                  </button>
                </div>
              </div>

              {/* Member Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Members
                </label>
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Member List */}
              <div className="max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {member.picture ? (
                            <img
                              src={member.picture}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-blue-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignPacer(member.id, selectedGroup, selectedRole)}
                        disabled={!selectedGroup || loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>

                {filteredMembers.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No members found matching your search.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminPacerManager;