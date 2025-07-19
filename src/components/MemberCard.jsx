import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiMail, FiPhone, FiMapPin, FiCalendar, FiCheck, FiX, FiUserPlus } = FiIcons;

function MemberCard({ member, onApprove, onReject, onTogglePublisher, canManage, index }) {
  const getRoleDisplay = (member) => {
    if (member.isAdmin) return 'Admin';
    if (member.canPublish) return 'Publisher';
    if (!member.isApproved) return 'Pending';
    return 'Member';
  };

  const getRoleColor = (member) => {
    if (member.isAdmin) return 'bg-purple-100 text-purple-800';
    if (member.canPublish) return 'bg-blue-100 text-blue-800';
    if (!member.isApproved) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
            {member.picture ? (
              <img 
                src={member.picture} 
                alt={member.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <SafeIcon icon={FiUsers} className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member)}`}>
              {getRoleDisplay(member)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <SafeIcon icon={FiMail} className="w-4 h-4" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={FiPhone} className="w-4 h-4" />
            <span>{member.phone}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <SafeIcon icon={FiMapPin} className="w-4 h-4" />
          <span>{member.location}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <SafeIcon icon={FiCalendar} className="w-4 h-4" />
          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{member.sessionsAttended || 0}</p>
          <p className="text-xs text-gray-500">Sessions</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
          </p>
          <p className="text-xs text-gray-500">Last Active</p>
        </div>
      </div>

      {/* Admin Actions */}
      {canManage && (
        <div className="space-y-2">
          {!member.isApproved && (
            <div className="flex space-x-2">
              <button
                onClick={() => onApprove(member.id)}
                className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiCheck} className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => onReject(member.id)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
          {member.isApproved && !member.isAdmin && (
            <button
              onClick={() => onTogglePublisher(member.id)}
              className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                member.canPublish
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <SafeIcon icon={member.canPublish ? FiX : FiUserPlus} className="w-4 h-4" />
              <span>{member.canPublish ? 'Remove Publisher' : 'Make Publisher'}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default MemberCard;