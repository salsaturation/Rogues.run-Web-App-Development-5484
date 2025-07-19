import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCalendar, FiClock, FiActivity, FiChevronRight } = FiIcons;

function RecommendedSessions() {
  const { user } = useAuth();
  const [matchedSessions, setMatchedSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecommendedSessions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRecommendedSessions = async () => {
    try {
      setLoading(true);
      const sessions = await sessionService.findSessionsByPacePreferences(user.id);
      setMatchedSessions(sessions);
    } catch (error) {
      console.error('Failed to load recommended sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.pacePreferences || user.pacePreferences.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center">
          <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pace preferences set</h3>
          <p className="text-gray-500 mb-4">
            Add your preferred running paces in your profile to get personalized session recommendations.
          </p>
          <Link to="/profile" className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-block hover:bg-blue-700 transition-colors">
            Set Pace Preferences
          </Link>
        </div>
      </div>
    );
  }

  if (matchedSessions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center">
          <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching sessions found</h3>
          <p className="text-gray-500">
            No upcoming sessions match your pace preferences. Check back later or browse all sessions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended for You</h2>
      <p className="text-sm text-gray-600 mb-6">
        Sessions that match your pace preferences
      </p>
      <div className="space-y-4">
        {matchedSessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-gray-900">{session.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType)}`}>
                  {session.runType}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiClock} className="w-4 h-4" />
                  <span>{session.time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiActivity} className="w-4 h-4" />
                  <span>{formatPace(session.paceMin)} - {formatPace(session.paceMax)} min/km</span>
                </div>
              </div>
            </div>
            <Link 
              to={`/sessions`} 
              state={{ sessionId: session.id }}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <SafeIcon icon={FiChevronRight} className="w-5 h-5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedSessions;