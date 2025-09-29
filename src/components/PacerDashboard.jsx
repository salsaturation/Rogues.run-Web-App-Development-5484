import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import pacerAnalyticsService from '../services/pacerAnalyticsService';
import paceGroupService from '../services/paceGroupService';
import toast from 'react-hot-toast';

const { FiTarget, FiUsers, FiActivity, FiAward, FiTrendingUp, FiClock, FiMapPin, FiCalendar, FiStar, FiCheck, FiAlertCircle, FiRefreshCw } = FiIcons;

export default function PacerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    communityStats: null,
    userStats: null,
    coverage: [],
    opportunities: [],
    achievements: [],
    recognition: [],
    goalsProgress: [],
    recentActivities: [],
    completedSessions: []
  });

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
        toast.loading('Refreshing pacer data...', { id: 'refresh' });
      }

      const [
        communityStats,
        userStats,
        coverage,
        opportunities,
        achievements,
        recognition,
        goalsProgress,
        recentActivities,
        completedSessions
      ] = await Promise.all([
        pacerAnalyticsService.getCommunityStats(),
        pacerAnalyticsService.getUserStats(user?.id),
        pacerAnalyticsService.getPacerCoverage(),
        pacerAnalyticsService.getPacerOpportunities(user?.id, 5),
        pacerAnalyticsService.getPacerAchievements(user?.id),
        pacerAnalyticsService.getPacerRecognition(5),
        pacerAnalyticsService.getPacerGoalsProgress(user?.id),
        pacerAnalyticsService.getRecentPacerActivities(user?.id, 10),
        pacerAnalyticsService.getCompletedSessions(5)
      ]);

      setData({
        communityStats,
        userStats,
        coverage: coverage || [],
        opportunities: opportunities || [],
        achievements: achievements || [],
        recognition: recognition || [],
        goalsProgress: goalsProgress || [],
        recentActivities: recentActivities || [],
        completedSessions: completedSessions || []
      });

      if (showToast) {
        toast.success('Data refreshed successfully!', { id: 'refresh' });
      }
    } catch (error) {
      console.error('Error fetching pacer data:', error);
      if (showToast) {
        toast.error('Failed to refresh data', { id: 'refresh' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDebugTest = async () => {
    toast.loading('Running debug tests...', { id: 'debug' });
    try {
      const results = await pacerAnalyticsService.debugTestAllEndpoints(user?.id);
      console.log('Debug test results:', results);
      toast.success('Debug tests completed! Check console for results.', { id: 'debug' });
    } catch (error) {
      console.error('Debug test failed:', error);
      toast.error('Debug tests failed. Check console for details.', { id: 'debug' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiRefreshCw} className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading pacer dashboard...</span>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, subtitle, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
          <SafeIcon icon={icon} className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );

  const GoalCard = ({ goal }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{goal.goal_name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          goal.status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {goal.status === 'completed' ? 'Completed' : 'In Progress'}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{goal.current_progress}/{goal.target_value}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {goal.progress_percentage}% complete
        </div>
      </div>
    </div>
  );

  const AchievementCard = ({ achievement }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <SafeIcon icon={FiAward} className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{achievement.achievement_name}</h4>
          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
          <p className="text-xs text-gray-500 mt-2">
            Earned: {achievement.earned_date}
          </p>
        </div>
      </div>
    </div>
  );

  const OpportunityCard = ({ opportunity }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{opportunity.session_name}</h4>
          <p className="text-sm text-gray-600 mt-1">{opportunity.pace_group_name}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center">
              <SafeIcon icon={FiCalendar} className="w-3 h-3 mr-1" />
              {opportunity.session_date}
            </span>
            <span className="flex items-center">
              <SafeIcon icon={FiTarget} className="w-3 h-3 mr-1" />
              {opportunity.target_pace}
            </span>
          </div>
        </div>
        {opportunity.needs_pacer && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            Needs Pacer
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pacer Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your pacing performance and opportunities</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDebugTest}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Debug Test
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <SafeIcon icon={FiRefreshCw} className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Pacers"
            value={data.communityStats?.total_pacers || 0}
            icon={FiUsers}
            trend="up"
          />
          <StatCard
            title="Active Pacers"
            value={data.communityStats?.active_pacers || 0}
            icon={FiActivity}
            trend="up"
          />
          <StatCard
            title="Total Sessions"
            value={data.communityStats?.total_sessions || 0}
            icon={FiCalendar}
          />
          <StatCard
            title="Sessions with Pacers"
            value={data.communityStats?.sessions_with_pacers || 0}
            icon={FiCheck}
          />
          <StatCard
            title="Avg Pacers/Session"
            value={data.communityStats?.avg_pacers_per_session || 0}
            icon={FiTrendingUp}
          />
          <StatCard
            title="Coverage"
            value={`${data.communityStats?.coverage_percentage || 0}%`}
            icon={FiTarget}
          />
        </div>

        {/* Personal Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Sessions Paced"
            value={data.userStats?.sessions_paced || 0}
            icon={FiActivity}
            subtitle="Last 30 days"
          />
          <StatCard
            title="Total Distance"
            value={`${data.userStats?.total_distance || 0} km`}
            icon={FiMapPin}
            subtitle="Paced distance"
          />
          <StatCard
            title="Favorite Pace"
            value={data.userStats?.favorite_pace || 'N/A'}
            icon={FiClock}
            subtitle="Most used"
          />
          <StatCard
            title="Consistency Score"
            value={`${data.userStats?.consistency_score || 0}%`}
            icon={FiStar}
            subtitle="Performance rating"
          />
          <StatCard
            title="Last Paced"
            value={data.userStats?.last_paced_date || 'Never'}
            icon={FiCalendar}
            subtitle="Most recent"
          />
        </div>

        {/* Goals Progress & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals Progress</h2>
            <div className="space-y-4">
              {data.goalsProgress.length > 0 ? (
                data.goalsProgress.map((goal, index) => (
                  <GoalCard key={index} goal={goal} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <SafeIcon icon={FiTarget} className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No goals data available</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Achievements</h2>
            <div className="space-y-4">
              {data.achievements.length > 0 ? (
                data.achievements.map((achievement, index) => (
                  <AchievementCard key={index} achievement={achievement} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <SafeIcon icon={FiAward} className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No achievements yet</p>
                  <p className="text-sm mt-1">Start pacing sessions to earn achievements!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Opportunities & Top Pacers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pacing Opportunities</h2>
            <div className="space-y-4">
              {data.opportunities.length > 0 ? (
                data.opportunities.map((opportunity, index) => (
                  <OpportunityCard key={index} opportunity={opportunity} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <SafeIcon icon={FiAlertCircle} className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pacing opportunities available</p>
                  <p className="text-sm mt-1">Check back later for new sessions</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Pacers</h2>
            <div className="space-y-4">
              {data.recognition.length > 0 ? (
                data.recognition.map((pacer, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{pacer.user_name}</h4>
                          <p className="text-sm text-gray-600">
                            {pacer.sessions_paced} sessions • {pacer.total_distance} km
                          </p>
                        </div>
                      </div>
                      <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <SafeIcon icon={FiUsers} className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recognition data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}