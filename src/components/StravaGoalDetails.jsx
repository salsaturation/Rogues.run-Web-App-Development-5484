import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useSettings } from '../contexts/SettingsContext';
import { formatDistanceWithUnit, DISTANCE_UNITS } from '../utils/unitConversion';

const {
  FiActivity, FiTrendingUp, FiAward, FiUsers,
  FiMap, FiHeart, FiClock, FiTarget, FiList, FiX
} = FiIcons;

function StravaGoalDetails({ goal, onClose }) {
  const { distanceUnit } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Mock data for demonstration
    setLeaderboard([
      { 
        id: 1, 
        name: "John Doe", 
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50", 
        value: 150.5, 
        activities: 12,
        rank: 1
      },
      { 
        id: 2, 
        name: "Jane Smith", 
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b9512fa6?w=50", 
        value: 120.2, 
        activities: 10,
        rank: 2
      },
      { 
        id: 3, 
        name: "Mike Johnson", 
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50", 
        value: 98.7, 
        activities: 8,
        rank: 3
      }
    ]);

    setRecentActivities([
      {
        id: 1,
        user: "John Doe",
        type: "Run",
        distance: 10.5,
        elevation: 120,
        date: "2024-02-15",
        time: "45:30",
        kudos: 12
      },
      {
        id: 2,
        user: "Jane Smith",
        type: "Run",
        distance: 8.2,
        elevation: 80,
        date: "2024-02-15",
        time: "38:15",
        kudos: 8
      },
      {
        id: 3,
        user: "Mike Johnson",
        type: "Run",
        distance: 12.0,
        elevation: 200,
        date: "2024-02-14",
        time: "55:42",
        kudos: 15
      }
    ]);
  }, [goal.id]);

  const formatMetricValue = (value, type) => {
    switch (type) {
      case 'distance':
        return formatDistanceWithUnit(value, distanceUnit);
      case 'elevation_gain':
        return `${Math.round(value)}m`;
      case 'duration':
        return `${Math.round(value)}h`;
      default:
        return Math.round(value);
    }
  };

  const getProgress = () => {
    if (!goal.target_value) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" 
                alt="Strava" 
                className="w-8 h-8"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{goal.title}</h2>
                <p className="text-gray-600 mt-1">{goal.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">
                {formatMetricValue(goal.current_value, goal.metric_type)} /
                {formatMetricValue(goal.target_value, goal.metric_type)}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-orange-600">
                {getProgress()}% Complete
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: FiActivity },
              { id: 'leaderboard', label: 'Leaderboard', icon: FiList },
              { id: 'activities', label: 'Recent Activities', icon: FiClock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SafeIcon icon={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <SafeIcon icon={FiUsers} className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Participants</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {goal.participant_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <SafeIcon icon={FiActivity} className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Activities</p>
                      <p className="text-2xl font-bold text-green-900">
                        {goal.activity_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <SafeIcon icon={FiAward} className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700">Achievements</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {goal.achievement_rules?.badges?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-500 rounded-lg">
                      <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-700">Avg Daily</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatMetricValue(goal.current_value / 30, goal.metric_type)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Badges */}
              {goal.achievement_rules?.badges && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Badges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {goal.achievement_rules.badges.map((badge, index) => {
                      const milestone = goal.achievement_rules.milestones[index];
                      const achieved = goal.current_value >= milestone;
                      
                      return (
                        <div
                          key={badge}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            achieved
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                achieved ? 'bg-yellow-400 text-white' : 'bg-gray-300 text-gray-500'
                              }`}
                            >
                              <SafeIcon icon={FiAward} className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className={`font-medium ${achieved ? 'text-yellow-800' : 'text-gray-600'}`}>
                                {badge}
                              </h4>
                              <p className={`text-sm ${achieved ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {formatMetricValue(milestone, goal.metric_type)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h3>
              <div className="space-y-4">
                {leaderboard.map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      participant.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          participant.rank === 1
                            ? 'bg-yellow-400 text-white'
                            : participant.rank === 2
                            ? 'bg-gray-400 text-white'
                            : participant.rank === 3
                            ? 'bg-orange-400 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {participant.rank}
                      </div>
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{participant.name}</p>
                        <p className="text-sm text-gray-500">{participant.activities} activities</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatMetricValue(participant.value, goal.metric_type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiActivity} className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <p className="text-sm text-gray-500">{activity.type} • {activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatDistanceWithUnit(activity.distance, distanceUnit)}</span>
                        <span>{activity.elevation}m ↗</span>
                        <span>{activity.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiHeart} className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-600">{activity.kudos}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default StravaGoalDetails;