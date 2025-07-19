import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { sessionService } from '../services/sessionService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { convertPace, formatPaceWithUnit, DISTANCE_UNITS } from '../utils/unitConversion';

const { FiActivity, FiCalendar, FiClock, FiMapPin, FiUsers, FiChevronRight } = FiIcons;

function RecommendedSessions() {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [recommendedSessions, setRecommendedSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      loadRecommendedSessions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRecommendedSessions = async () => {
    try {
      setLoading(true);
      const sessions = await sessionService.findSessionsByPacePreferences(user.id);
      setRecommendedSessions(sessions.slice(0, 3)); // Show top 3 recommendations
    } catch (error) {
      console.error('Failed to load recommended sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPace = (pace) => {
    if (!pace) return '0:00';
    const convertedPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    const minutes = Math.floor(convertedPace);
    const seconds = Math.round((convertedPace - minutes) * 60);
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

  if (!user || !user.pacePreferences || user.pacePreferences.length === 0) {
    return null; // Don't show if user has no pace preferences
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Sessions</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </motion.div>
    );
  }

  if (recommendedSessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Sessions</h2>
        <div className="text-center py-8">
          <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No matching sessions found based on your pace preferences</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new sessions!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
        <SafeIcon icon={FiActivity} className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {recommendedSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => window.location.href = `#/sessions?id=${session.id}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="font-medium text-gray-900">{session.title}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
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
                    <span>
                      {session.paceMin && session.paceMax ? 
                        `${formatPace(session.paceMin)} - ${formatPace(session.paceMax)} min/${distanceUnit}` : 
                        'Pace not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {session.runType && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType)}`}>
                  {session.runType}
                </span>
              )}
              <SafeIcon icon={FiChevronRight} className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '#/sessions'}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all sessions →
        </button>
      </div>
    </motion.div>
  );
}

export default RecommendedSessions;