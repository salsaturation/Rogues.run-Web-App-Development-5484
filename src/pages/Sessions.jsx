import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import SessionForm from '../components/SessionForm';
import SessionDetailView from '../components/SessionDetailView';
import toast from 'react-hot-toast';

const {
  FiPlus, 
  FiMapPin, 
  FiClock, 
  FiUsers, 
  FiCalendar,
  FiFilter, 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiList, 
  FiGrid, 
  FiActivity, 
  FiArrowUp, 
  FiArrowDown,
  FiThumbsUp,
  FiX
} = FiIcons;

function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [userInterests, setUserInterests] = useState({});

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getSessions();
      setSessions(data);

      // Load user interests
      if (user && user.id) {
        const interests = {};
        for (const session of data) {
          interests[session.id] = await sessionService.isUserInterested(session.id, user.id);
        }
        setUserInterests(interests);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      (session.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (session.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (session.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    
    const matchesType = filterType === 'all' || session.runType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'attendees':
        comparison = (a.attendeeCount || 0) - (b.attendeeCount || 0);
        break;
      case 'distance':
        comparison = (a.totalDistance || 0) - (b.totalDistance || 0);
        break;
      default:
        comparison = new Date(a.date) - new Date(b.date);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleCreateSession = async (sessionData) => {
    try {
      await sessionService.createSession(sessionData, user?.id);
      setShowCreateModal(false);
      loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleUpdateSession = async (sessionData) => {
    try {
      await sessionService.updateSession(editingSession.id, sessionData);
      setEditingSession(null);
      loadSessions();
      if (viewingSession && viewingSession.id === editingSession.id) {
        const updatedSession = await sessionService.getSessionById(editingSession.id);
        setViewingSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      if (!user || !user.id) {
        toast.error('You must be logged in to join sessions');
        return;
      }
      
      await sessionService.joinSession(sessionId, user.id);
      loadSessions();
      if (viewingSession && viewingSession.id === sessionId) {
        const updatedSession = await sessionService.getSessionById(sessionId);
        setViewingSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleToggleInterest = async (sessionId) => {
    try {
      if (!user || !user.id) {
        toast.error('You must be logged in to mark interest');
        return;
      }
      
      const isInterested = await sessionService.toggleInterest(sessionId, user.id);
      setUserInterests(prev => ({
        ...prev,
        [sessionId]: isInterested
      }));
      
      if (viewingSession && viewingSession.id === sessionId) {
        const updatedSession = await sessionService.getSessionById(sessionId);
        setViewingSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to toggle interest:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!user?.isAdmin && !canEditSession(sessions.find(s => s.id === sessionId))) {
      toast.error('You don\'t have permission to delete this session');
      return;
    }

    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await sessionService.deleteSession(sessionId);
        if (viewingSession && viewingSession.id === sessionId) {
          setViewingSession(null);
        }
        loadSessions();
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const handleViewSession = async (sessionId) => {
    try {
      const session = await sessionService.getSessionById(sessionId);
      setViewingSession(session);
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
  };

  const canEditSession = (session) => {
    if (!session || !user) return false;
    return user?.isAdmin || session.createdBy === user?.id;
  };

  const isUserAttending = (session) => {
    if (!user || !session.attendees) return false;
    
    return session.attendees.some(attendee => 
      attendee.user_id === user.id || 
      (attendee.user && attendee.user.email === user.email)
    );
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

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If viewing a specific session
  if (viewingSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewingSession(null)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiChevronLeft} className="w-5 h-5" />
            <span>Back to Sessions</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
        </div>
        
        <SessionDetailView
          session={viewingSession}
          onJoin={handleJoinSession}
          onEdit={handleEditSession}
          onDelete={handleDeleteSession}
          canEdit={canEditSession(viewingSession)}
          userAttending={isUserAttending(viewingSession)}
          userInterested={userInterests[viewingSession.id]}
          onToggleInterest={handleToggleInterest}
        />
      </div>
    );
  }

  // If editing a session
  if (editingSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setEditingSession(null)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiChevronLeft} className="w-5 h-5" />
            <span>Back to Sessions</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <SessionForm
            initialData={editingSession}
            onSubmit={handleUpdateSession}
            isEdit={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Running Sessions</h1>
          <p className="text-gray-600">Manage and join running sessions</p>
        </div>
        {(user?.canPublish || user?.isAdmin) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-5 h-5" />
            <span>Create Session</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SafeIcon
              icon={FiSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="easy">Easy</option>
              <option value="tempo">Tempo</option>
              <option value="interval">Interval</option>
              <option value="long-slow">Long Slow</option>
              <option value="trail">Trail</option>
            </select>
            
            <div className="flex">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-y border-l border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="attendees">Sort by Attendees</option>
                <option value="distance">Sort by Distance</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border-y border-r border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100"
              >
                <SafeIcon icon={sortDirection === 'asc' ? FiArrowUp : FiArrowDown} className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              >
                <SafeIcon icon={FiGrid} className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              >
                <SafeIcon icon={FiList} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => handleViewSession(session.id)}
                    >
                      {session.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status || 'confirmed')}`}>
                      {session.status || 'confirmed'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {session.description || 'No description provided'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                      <SafeIcon icon={FiClock} className="w-4 h-4 ml-2" />
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                      <span className="truncate">{session.startLocationName || session.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <SafeIcon icon={FiUsers} className="w-4 h-4" />
                        <span>{session.attendeeCount} / {session.maxAttendees}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {session.runType && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType)}`}>
                            {session.runType}
                          </span>
                        )}
                        {session.difficulty && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
                            {session.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleJoinSession(session.id)}
                  disabled={session.attendeeCount >= session.maxAttendees && !isUserAttending(session)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isUserAttending(session)
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : session.attendeeCount >= session.maxAttendees
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isUserAttending(session)
                    ? 'Leave'
                    : session.attendeeCount >= session.maxAttendees
                    ? 'Full'
                    : 'Join'}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewSession(session.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <SafeIcon icon={FiChevronRight} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleInterest(session.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      userInterests[session.id]
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={userInterests[session.id] ? 'Remove interest' : 'Mark as interested'}
                  >
                    <SafeIcon icon={FiThumbsUp} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SafeIcon icon={FiActivity} className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => handleViewSession(session.id)}
                      >
                        {session.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status || 'confirmed')}`}>
                        {session.status || 'confirmed'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                        <span>{session.startLocationName || session.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <SafeIcon icon={FiUsers} className="w-4 h-4" />
                        <span>{session.attendeeCount} / {session.maxAttendees}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {session.runType && (
                    <span className={`hidden md:inline-block px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType)}`}>
                      {session.runType}
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleJoinSession(session.id)}
                    disabled={session.attendeeCount >= session.maxAttendees && !isUserAttending(session)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isUserAttending(session)
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : session.attendeeCount >= session.maxAttendees
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUserAttending(session)
                      ? 'Leave'
                      : session.attendeeCount >= session.maxAttendees
                      ? 'Full'
                      : 'Join'}
                  </button>
                  
                  <button
                    onClick={() => handleToggleInterest(session.id)}
                    className={`p-2 rounded-full transition-colors ${
                      userInterests[session.id]
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={userInterests[session.id] ? 'Remove interest' : 'Mark as interested'}
                  >
                    <SafeIcon icon={FiThumbsUp} className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleViewSession(session.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="View details"
                  >
                    <SafeIcon icon={FiChevronRight} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {sortedSessions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <SafeIcon icon={FiCalendar} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
          {(user?.canPublish || user?.isAdmin) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Session
            </button>
          )}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Session</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <SafeIcon icon={FiX} className="w-5 h-5" />
              </button>
            </div>
            
            <SessionForm
              onSubmit={handleCreateSession}
              isEdit={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Sessions;