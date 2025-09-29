import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import { memberService } from '../services/memberService';
import { goalService } from '../services/goalService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import RecommendedSessions from '../components/RecommendedSessions';
import PacerDashboard from '../components/PacerDashboard';

const { FiTarget, FiPlus, FiCheck, FiClock, FiTrendingUp, FiUsers, FiActivity, FiCalendar, FiAward, FiUserCheck } = FiIcons;

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    totalDistance: 0,
    averagePace: 0,
    streak: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [communityGoals, setCommunityGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user stats
      const userStats = await sessionService.getUserStats(user.id);
      setStats(userStats);

      // Load upcoming sessions
      const upcoming = await sessionService.getUpcomingSessions(5);
      const userUpcoming = upcoming.filter(session => 
        session.attendees?.some(attendee => attendee.userId === user.id) ||
        session.interestedUsers?.some(interested => interested.userId === user.id)
      );
      setUpcomingSessions(userUpcoming);

      // Load recent completed sessions
      const completed = await sessionService.getCompletedSessions(user.id, 3);
      setRecentSessions(completed);

      // Load recent activities
      const activities = await sessionService.getRecentActivities(user.id, 5);
      setRecentActivities(activities);

      // Load community goals
      const goals = await goalService.getCommunityGoals();
      setCommunityGoals(goals);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    if (upcomingSessions.length > 0) {
      const nextSession = upcomingSessions[0];
      const sessionDate = new Date(nextSession.date);
      const today = new Date();
      const isToday = sessionDate.toDateString() === today.toDateString();
      const isTomorrow = sessionDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();

      if (isToday) {
        return `${greeting}, ${user.name}! You have "${nextSession.title}" today at ${nextSession.time}. Ready to run? 🏃‍♂️`;
      } else if (isTomorrow) {
        return `${greeting}, ${user.name}! Your next session "${nextSession.title}" is tomorrow at ${nextSession.time}. 🌟`;
      } else {
        return `${greeting}, ${user.name}! Your next session "${nextSession.title}" is on ${sessionDate.toLocaleDateString()}. 📅`;
      }
    }

    return `${greeting}, ${user.name}! Ready to crush your running goals today? 💪`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-blue-100 text-lg">{getWelcomeMessage()}</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('pacer')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pacer'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🏃 Pacer Dashboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiCalendar} className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiCheck} className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalDistance)}mi</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiActivity} className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.streak}w</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* My Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">📅 My Upcoming Sessions</h2>
                <span className="text-sm text-gray-500">{upcomingSessions.length} sessions</span>
              </div>
              <div className="space-y-3">
                {upcomingSessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <SafeIcon icon={FiCalendar} className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString()} at {session.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-blue-600">
                        {session.attendees?.some(a => a.userId === user.id) ? 'Attending' : 'Interested'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recently Completed */}
          {recentSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">✅ Recently Completed</h2>
              </div>
              <div className="space-y-3">
                {recentSessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-600">
                          Completed on {new Date(session.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-green-600">
                        {session.totalDistance ? `${Math.round(session.totalDistance)}mi` : 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Activity Feed */}
          {recentActivities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">🔔 Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiActivity} className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Community Goals Progress */}
          {communityGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">🎯 Community Goals Progress</h2>
              </div>
              <div className="space-y-4">
                {communityGoals.map((goal, index) => (
                  <div key={goal.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      <span className="text-sm font-medium text-yellow-600">
                        {Math.round((goal.progress / goal.target) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((goal.progress / goal.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {goal.progress} / {goal.target} {goal.unit}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommended Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Recommended for You</h2>
            <RecommendedSessions userId={user.id} limit={3} />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <SafeIcon icon={FiPlus} className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-900">Join Session</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <SafeIcon icon={FiTarget} className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-900">Set Goal</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <SafeIcon icon={FiUsers} className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-900">View Members</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <SafeIcon icon={FiCalendar} className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">Calendar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'pacer' && (
        <PacerDashboard />
      )}
    </div>
  );
}

export default Dashboard;