import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { 
  FiUsers, FiSearch, FiFilter, FiMoreVertical, FiMail, FiPhone, 
  FiCalendar, FiMapPin, FiShield, FiEdit, FiCheck, FiX, FiUserPlus, FiClock
} = FiIcons;

function Members() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1234567890',
      picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      joinDate: '2023-01-15',
      lastActive: '2024-01-18',
      sessionsAttended: 45,
      isAdmin: true,
      canPublish: true,
      isApproved: true,
      provider: 'facebook',
      location: 'New York, NY'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1234567891',
      picture: 'https://images.unsplash.com/photo-1494790108755-2616b9512fa6?w=100&h=100&fit=crop&crop=face',
      joinDate: '2023-03-20',
      lastActive: '2024-01-19',
      sessionsAttended: 32,
      isAdmin: false,
      canPublish: true,
      isApproved: true,
      provider: 'facebook',
      location: 'Brooklyn, NY'
    },
    {
      id: 3,
      name: 'Mike Davis',
      email: 'mike@example.com',
      phone: '+1234567892',
      picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      joinDate: '2023-06-10',
      lastActive: '2024-01-17',
      sessionsAttended: 28,
      isAdmin: false,
      canPublish: false,
      isApproved: true,
      provider: 'phone',
      location: 'Manhattan, NY'
    },
    {
      id: 4,
      name: 'Lisa Chen',
      email: 'lisa@example.com',
      phone: '+1234567893',
      picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      joinDate: '2023-09-05',
      lastActive: '2024-01-19',
      sessionsAttended: 15,
      isAdmin: false,
      canPublish: false,
      isApproved: true,
      provider: 'facebook',
      location: 'Queens, NY'
    },
    {
      id: 5,
      name: 'Tom Wilson',
      email: 'tom@example.com',
      phone: '+1234567894',
      picture: null,
      joinDate: '2024-01-10',
      lastActive: '2024-01-18',
      sessionsAttended: 3,
      isAdmin: false,
      canPublish: false,
      isApproved: false,
      provider: 'phone',
      location: 'Bronx, NY'
    }
  ]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && member.isAdmin) ||
                       (filterRole === 'publisher' && member.canPublish && !member.isAdmin) ||
                       (filterRole === 'member' && !member.canPublish && !member.isAdmin) ||
                       (filterRole === 'pending' && !member.isApproved);
    return matchesSearch && matchesRole;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'joinDate':
        return new Date(b.joinDate) - new Date(a.joinDate);
      case 'sessions':
        return b.sessionsAttended - a.sessionsAttended;
      case 'lastActive':
        return new Date(b.lastActive) - new Date(a.lastActive);
      default:
        return 0;
    }
  });

  const handleApproveUser = (memberId) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can approve members');
      return;
    }
    setMembers(members.map(member => 
      member.id === memberId ? { ...member, isApproved: true } : member
    ));
    toast.success('Member approved successfully');
  };

  const handleRejectUser = (memberId) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can reject members');
      return;
    }
    setMembers(members.filter(member => member.id !== memberId));
    toast.success('Member rejected');
  };

  const handleTogglePublisher = (memberId) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can manage publisher permissions');
      return;
    }
    setMembers(members.map(member => 
      member.id === memberId ? { ...member, canPublish: !member.canPublish } : member
    ));
    toast.success('Publisher permissions updated');
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600">Manage community members and permissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {filteredMembers.length} of {members.length} members
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="publisher">Publisher</option>
            <option value="member">Member</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="joinDate">Sort by Join Date</option>
            <option value="sessions">Sort by Sessions</option>
            <option value="lastActive">Sort by Last Active</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
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
              {user?.isAdmin && (
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <SafeIcon icon={FiMoreVertical} className="w-4 h-4" />
                </button>
              )}
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
                <p className="text-2xl font-bold text-gray-900">{member.sessionsAttended}</p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(member.lastActive).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">Last Active</p>
              </div>
            </div>

            {/* Admin Actions */}
            {user?.isAdmin && (
              <div className="space-y-2">
                {!member.isApproved && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveUser(member.id)}
                      className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiCheck} className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectUser(member.id)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiX} className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
                {member.isApproved && !member.isAdmin && (
                  <button
                    onClick={() => handleTogglePublisher(member.id)}
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
        ))}
      </div>

      {sortedMembers.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiUsers} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
            <SafeIcon icon={FiUsers} className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">{members.filter(m => m.isApproved).length}</p>
            </div>
            <SafeIcon icon={FiCheck} className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Publishers</p>
              <p className="text-2xl font-bold text-gray-900">{members.filter(m => m.canPublish).length}</p>
            </div>
            <SafeIcon icon={FiEdit} className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{members.filter(m => !m.isApproved).length}</p>
            </div>
            <SafeIcon icon={FiClock} className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Members;