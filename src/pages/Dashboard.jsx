import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAuth} from '../contexts/AuthContext';
import {sessionService} from '../services/sessionService';
import {memberService} from '../services/memberService';
import {goalService} from '../services/goalService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import RecommendedSessions from '../components/RecommendedSessions';

const {FiActivity, FiUsers, FiCalendar, FiTrendingUp, FiClock, FiMapPin, FiPlay, FiTarget, FiAward, FiCheckCircle, FiThumbsUp, FiChevronRight, FiPlus} = FiIcons;

function Dashboard() {
  const {user} = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeMembers: 0,
    thisMonth: 0,
    avgAttendance: 0,
    completedSessions: 0,
    mySessionsAttended: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [myUpcomingSessions, setMyUpcomingSessions] = useState([]);
  const [recentCompletedSessions, setRecentCompletedSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [communityGoals, setCommunityGoals] = useState([]);
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
      const goals = await goalService.getGoals();

      // Calculate stats
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const sessionsThisMonth = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getMonth() === thisMonth && sessionDate.getFullYear() === thisYear;
      });

      const completedSessions = sessions.filter(session => session.status === 'completed');
      const totalAttendees = sessions.reduce((sum, session) => sum + session.attendeeCount, 0);
      const avgAttendance = sessions.length > 0 ? Math.round(totalAttendees / sessions.length) : 0;

      // Get user's attended sessions
      const myAttendedSessions = sessions.filter(session => 
        session.attendees?.some(attendee => 
          attendee.user_id === user.id || 
          (attendee.user && attendee.user.email === user.email)
        )
      );

      setStats({
        totalSessions: sessions.length,
        activeMembers: members.filter(m => m.isApproved).length,
        thisMonth: sessionsThisMonth.length,
        avgAttendance: avgAttendance,
        completedSessions: completedSessions.length,
        mySessionsAttended: myAttendedSessions.length
      });

      // Get upcoming sessions (next 5)
      const upcoming = sessions
        .filter(session => new Date(session.date) >= now && session.status !== 'completed')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
      setUpcomingSessions(upcoming);

      // Get my upcoming sessions
      const myUpcoming = sessions
        .filter(session => {
          const isFuture = new Date(session.date) >= now && session.status !== 'completed';
          const isAttending = session.attendees?.some(attendee => 
            attendee.user_id === user.id || 
            (attendee.user && attendee.user.email === user.email)
          );
          return isFuture && isAttending;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      setMyUpcomingSessions(myUpcoming);

      // Get recent completed sessions
      const recentCompleted = sessions
        .filter(session => session.status === 'completed')
        .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date))
        .slice(0, 3);
      setRecentCompletedSessions(recentCompleted);

      // Set community goals
      setCommunityGoals(goals.slice(0, 3));

      // Enhanced recent activity
      const activities = [];
      
      // Add session activities
      if (upcoming.length > 0) {
        activities.push({
          id: 'upcoming-1',
          type: 'session',
          message: `"${upcoming[0].title}" starting ${new Date(upcoming[0].date).toLocaleDateString()}`,
          time: '1 hour ago',
          icon: FiPlay,
          action: () => window.location.href = `#/sessions?id=${upcoming[0].id}`
        });
      }

      // Add member activity
      const recentMembers = members
        .filter(m => m.joinDate)
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 3);

      if (recentMembers.length > 0) {
        activities.push({
          id: 'member-1',
          type: 'member',
          message: `${recentMembers[0].name} joined the community`,
          time: '3 hours ago',
          icon: FiUsers
        });
      }

      // Add goal activity
      if (goals.length > 0) {
        const activeGoal = goals.find(g => g.progress < 100) || goals[0];
        activities.push({
          id: 'goal-1',
          type: 'achievement',
          message: `"${activeGoal.title}" - ${activeGoal.progress}% complete`,
          time: '5 hours ago',
          icon: FiTarget,
          action: () => window.location.href = '#/goals'
        });
      }

      // Add completed session activity
      if (recentCompleted.length > 0) {
        activities.push({
          id: 'completed-1',
          type: 'completion',
          message: `"${recentCompleted[0].title}" completed with ${recentCompleted[0].attendeeCount} participants`,
          time: '1 day ago',
          icon: FiCheckCircle
        });
      }

      setRecentActivity(activities);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
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
            {myUpcomingSessions.length > 0 && (
              <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                <p className="text-sm text-blue-100 mb-1">Your next session:</p>
                <p className="font-medium">
                  {myUpcomingSessions[0].title} - {new Date(myUpcomingSessions[0].date).toLocaleDateString()} at {myUpcomingSessions[0].time}
                </p>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiActivity} className="w-12 h-12" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Sessions',
            value: stats.totalSessions,
            change: '+12%',
            icon: FiActivity,
            color: 'blue',
            subtitle: `${stats.completedSessions} completed`
          },
          {
            title: 'Active Members', 
            value: stats.activeMembers,
            change: '+3',
            icon: FiUsers,
            color: 'green',
            subtitle: 'approved members'
          },
          {
            title: 'This Month',
            value: stats.thisMonth,
            change: '+2',
            icon: FiCalendar,
            color: 'purple',
            subtitle: 'sessions scheduled'
          },
          {
            title: 'My Sessions',
            value: stats.mySessionsAttended,
            change: '+5%',
            icon: FiCheckCircle,
            color: 'orange',
            subtitle: 'sessions attended'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: index * 0.1}}
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
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommended Sessions */}
      {user && user.pacePreferences && user.pacePreferences.length > 0 && (
        <RecommendedSessions />
      )}

      {/* My Upcoming Sessions */}
      {myUpcomingSessions.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Upcoming Sessions</h2>
            <SafeIcon icon={FiThumbsUp} className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {myUpcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </span>
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
                <div className="flex items-center space-x-2">
                  {session.runType && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType)}`}>
                      {session.runType}
                    </span>
                  )}
                  <button
                    onClick={() => window.location.href = `#/sessions?id=${session.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View</span>
                    <SafeIcon icon={FiChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Upcoming Sessions */}
        <motion.div
          initial={{opacity: 0, x: -20}}
          animate={{opacity: 1, x: 0}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiCalendar} className="w-5 h-5 text-gray-400" />
              <button
                onClick={() => window.location.href = '#/sessions'}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                   onClick={() => window.location.href = `#/sessions?id=${session.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>{session.time}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                        <span>{session.startLocationName || session.location}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {session.runType && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType)}`}>
                      {session.runType}
                    </span>
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{session.attendeeCount} attending</p>
                    <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiCalendar} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming sessions</p>
                <button
                  onClick={() => window.location.href = '#/sessions'}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Browse all sessions
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{opacity: 0, x: 20}}
          animate={{opacity: 1, x: 0}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <SafeIcon icon={FiActivity} className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'session' ? 'bg-blue-100' :
                  activity.type === 'member' ? 'bg-green-100' :
                  activity.type === 'achievement' ? 'bg-purple-100' :
                  activity.type === 'completion' ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <SafeIcon 
                    icon={activity.icon} 
                    className={`w-4 h-4 ${
                      activity.type === 'session' ? 'text-blue-600' :
                      activity.type === 'member' ? 'text-green-600' :
                      activity.type === 'achievement' ? 'text-purple-600' :
                      activity.type === 'completion' ? 'text-orange-600' : 'text-gray-600'
                    }`} 
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  {activity.action && (
                    <button
                      onClick={activity.action}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                    >
                      View details →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Completed Sessions */}
      {recentCompletedSessions.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recently Completed</h2>
            <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-green-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCompletedSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => window.location.href = `#/sessions?id=${session.id}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiCheckCircle} className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">COMPLETED</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{session.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <SafeIcon icon={FiCalendar} className="w-3 h-3" />
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <SafeIcon icon={FiUsers} className="w-3 h-3" />
                    <span>{session.attendeeCount} participants</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Community Goals Progress */}
      {communityGoals.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Community Goals</h2>
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiTarget} className="w-5 h-5 text-gray-400" />
              <button
                onClick={() => window.location.href = '#/goals'}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {communityGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{goal.title}</h3>
                  <span className="text-sm font-medium text-blue-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{width: `${Math.min(goal.progress, 100)}%`}}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{goal.currentValue} / {goal.targetValue}</span>
                  {goal.targetDate && (
                    <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '#/sessions'}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <SafeIcon icon={FiPlay} className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Browse Sessions</p>
            <p className="text-sm text-gray-500">Find sessions to join</p>
          </button>

          {(user?.canPublish || user?.isAdmin) && (
            <button
              onClick={() => window.location.href = '#/sessions'}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <SafeIcon icon={FiPlus} className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Create Session</p>
              <p className="text-sm text-gray-500">Schedule a new run</p>
            </button>
          )}

          <button
            onClick={() => window.location.href = '#/goals'}
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <SafeIcon icon={FiTarget} className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Set Goals</p>
            <p className="text-sm text-gray-500">Track your progress</p>
          </button>

          <button
            onClick={() => window.location.href = '#/profile'}
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <SafeIcon icon={FiUsers} className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-medium text-gray-900">Update Profile</p>
            <p className="text-sm text-gray-500">Manage your settings</p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;