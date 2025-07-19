import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { memberService } from '../services/memberService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { 
  FiUsers, FiSearch, FiFilter, FiMoreVertical, FiMail, FiPhone, 
  FiCalendar, FiMapPin, FiShield, FiEdit, FiCheck, FiX, FiUserPlus, 
  FiClock, FiSend
} = FiIcons;

function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await memberService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const data = await memberService.getInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

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

  const handleApproveUser = async (memberId) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can approve members');
      return;
    }

    try {
      await memberService.approveMember(memberId);
      loadMembers();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleRejectUser = async (memberId) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can reject members');
      return;
    }

    if (window.confirm('Are you sure you want to reject this member?')) {
      try {
        await memberService.rejectMember(memberId);
        loadMembers();
      } catch (error) {
        console.error('Failed to reject user:', error);
      }
    }
  };

  const handleTogglePublisher = async (memberId, currentStatus) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can manage publisher permissions');
      return;
    }

    try {
      await memberService.togglePublisher(memberId, currentStatus);
      loadMembers();
    } catch (error) {
      console.error('Failed to toggle publisher:', error);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    
    try {
      await memberService.sendInvitation(inviteData, user.id);
      setInviteData({ email: '', name: '', phone: '' });
      setShowInviteModal(false);
      loadInvitations();
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600">Manage community members and permissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiSend} className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
          <span className="text-sm text-gray-500">
            {filteredMembers.length} of {members.length} members
          </span>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-3">Pending Invitations ({invitations.length})</h3>
          <div className="space-y-2">
            {invitations.slice(0, 3).map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">
                  {invitation.name || invitation.email} - {invitation.email}
                </span>
                <span className="text-yellow-600">
                  Expires {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {invitations.length > 3 && (
              <p className="text-yellow-600 text-sm">+{invitations.length - 3} more pending...</p>
            )}
          </div>
        </div>
      )}

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
                  {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
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
                    onClick={() => handleTogglePublisher(member.id, member.canPublish)}
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invite New Member</h2>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({...inviteData, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Members;