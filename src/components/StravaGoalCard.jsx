import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useSettings } from '../contexts/SettingsContext';
import { formatDistanceWithUnit, DISTANCE_UNITS } from '../utils/unitConversion';

const { 
  FiActivity, FiTrendingUp, FiAward, FiUsers, 
  FiMap, FiHeart, FiClock, FiTarget 
} = FiIcons;

function StravaGoalCard({ goal, onViewDetails }) {
  const { distanceUnit } = useSettings();

  const getMetricIcon = (type) => {
    switch (type) {
      case 'distance':
        return FiActivity;
      case 'elevation_gain':
        return FiTrendingUp;
      case 'kudos':
        return FiHeart;
      case 'attempts':
        return FiTarget;
      case 'duration':
        return FiClock;
      default:
        return FiActivity;
    }
  };

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

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'club':
        return FiUsers;
      case 'pace_group':
        return FiMap;
      case 'individual':
        return FiTarget;
      default:
        return FiActivity;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <SafeIcon 
              icon={getScopeIcon(goal.scope)} 
              className={`w-5 h-5 text-${goal.scope === 'club' ? 'blue' : goal.scope === 'pace_group' ? 'purple' : 'green'}-600`} 
            />
            <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
          </div>
          <p className="text-sm text-gray-600">{goal.description}</p>
        </div>
        {goal.achievement_rules?.badges && (
          <div className="flex -space-x-2">
            {goal.achievement_rules.badges.map((badge, index) => (
              <div
                key={badge}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  goal.current_value >= goal.achievement_rules.milestones[index]
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <SafeIcon icon={FiAward} className="w-4 h-4" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={getMetricIcon(goal.metric_type)} className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Progress</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatMetricValue(goal.current_value, goal.metric_type)} / 
              {formatMetricValue(goal.target_value, goal.metric_type)}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(getProgress())} transition-all duration-500`}
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Goal Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Participants</p>
            <p className="text-xl font-bold text-gray-900">
              {goal.participant_count || 0}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Activities</p>
            <p className="text-xl font-bold text-gray-900">
              {goal.activity_count || 0}
            </p>
          </div>
        </div>

        {/* Strava Integration Status */}
        {goal.auto_sync && (
          <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
            <div className="flex items-center space-x-2">
              <img src="/strava-icon.svg" alt="Strava" className="w-4 h-4" />
              <span>Auto-syncing with Strava</span>
            </div>
            <span className="text-green-600">Active</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onViewDetails(goal)}
        className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
      >
        View Details
      </button>
    </motion.div>
  );
}

export default StravaGoalCard;