import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import { memberService } from '../services/memberService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiActivity, FiUsers, FiCalendar, FiTrendingUp, FiClock, FiMapPin,
  FiPlay, FiTarget, FiAward
} = FiIcons;

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeMembers: 0,
    thisMonth: 0,
    avgAttendance: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load sessions
      const sessions = await sessionService.getSessions();
      const members = await memberService.getMembers();
      
      // Calculate stats
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const sessionsThisMonth = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getMonth() === thisMonth && sessionDate.getFullYear() === thisYear;
      });

      const totalAttendees = sessions.reduce((sum, session) => sum + session.attendeeCount, 0);
      const avgAttendance = sessions.length > 0 ? Math.round(totalAttendees / sessions.length) : 0;

      setStats({
        totalSessions: sessions.length,
        activeMembers: members.filter(m => m.isApproved).length,
        thisMonth: sessionsThisMonth.length,
        avgAttendance: avgAttendance
      });

      // Get upcoming sessions (next 3)
      const upcoming = sessions
        .filter(session => new Date(session.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      
      setUpcomingSessions(upcoming);

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          type: 'session',
          message: `New session "${sessions[0]?.title || 'Morning Run'}" created`,
          time: '2 hours ago',
          icon: FiPlay
        },
        {
          id: 2,
          type: 'member',
          message: 'New member joined the group',
          time: '5 hours ago',
          icon: FiUsers
        },
        {
          id: 3,
          type: 'achievement',
          message: 'Group completed milestone!',
          time: '1 day ago',
          icon: FiAward
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 🏃‍♂️
            </h1>
            <p className="text-blue-100 text-lg">
              Ready for your next run? Check out today's activities.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiActivity} className="w-12 h-12" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Sessions', value: stats.totalSessions, change: '+12%', icon: FiActivity, color: 'blue' },
          { title: 'Active Members', value: stats.activeMembers, change: '+3', icon: FiUsers, color: 'green' },
          { title: 'This Month', value: stats.thisMonth, change: '+2', icon: FiCalendar, color: 'purple' },
          { title: 'Avg. Attendance', value: stats.avgAttendance, change: '+5%', icon: FiTrendingUp, color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm font-medium mt-1 ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
            <SafeIcon icon={FiCalendar} className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>{session.time}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                        <span>{session.location}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.attendeeCount} attending</p>
                  <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiCalendar} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming sessions</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <SafeIcon icon={FiActivity} className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <SafeIcon icon={activity.icon} className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <SafeIcon icon={FiPlay} className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Create Session</p>
            <p className="text-sm text-gray-500">Schedule a new running session</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <SafeIcon icon={FiUsers} className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Invite Members</p>
            <p className="text-sm text-gray-500">Send invitations to new runners</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <SafeIcon icon={FiTarget} className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Set Goals</p>
            <p className="text-sm text-gray-500">Track group achievements</p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;