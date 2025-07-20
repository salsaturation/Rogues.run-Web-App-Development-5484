import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { goalService } from '../services/goalService';
import { stravaService } from '../services/stravaService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import StravaGoalCard from '../components/StravaGoalCard';
import StravaConnectModal from '../components/StravaConnectModal';
import toast from 'react-hot-toast';

const {
  FiTarget, FiPlus, FiEdit, FiTrash2, FiCalendar, FiTrendingUp,
  FiUsers, FiActivity, FiAward, FiCheckCircle, FiLink, FiSettings
} = FiIcons;

function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [stravaGoals, setStravaGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'strava', 'regular'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStravaConnect, setShowStravaConnect] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    goalType: 'sessions',
    targetDate: '',
    // Strava-specific fields
    isStravaGoal: false,
    metricType: 'distance',
    scope: 'individual',
    autoSync: true
  });

  useEffect(() => {
    loadGoals();
    checkStravaConnection();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      
      // Load regular goals
      const regularGoals = await goalService.getGoals();
      setGoals(regularGoals);
      
      // Load Strava goals (mock data for now)
      const mockStravaGoals = [
        {
          id: 'strava-1',
          title: 'Spring 5000km Challenge',
          description: 'Club-wide distance challenge for Spring 2024 - automatically synced with Strava activities',
          target_value: 5000,
          current_value: 3247,
          metric_type: 'distance',
          scope: 'club',
          auto_sync: true,
          participant_count: 24,
          activity_count: 156,
          achievement_rules: {
            milestones: [1000, 2500, 5000],
            badges: ['Bronze Runner', 'Silver Sprinter', 'Gold Champion']
          }
        },
        {
          id: 'strava-2',
          title: 'Everest Challenge',
          description: 'Collective elevation gain to match Mount Everest height (8,848m)',
          target_value: 8848,
          current_value: 5420,
          metric_type: 'elevation_gain',
          scope: 'club',
          auto_sync: true,
          participant_count: 18,
          activity_count: 89,
          achievement_rules: {
            milestones: [2000, 5000, 8848],
            badges: ['Base Camp', 'Summit Attempt', 'Everest Conqueror']
          }
        },
        {
          id: 'strava-3',
          title: 'Personal Marathon Training',
          description: 'Individual goal to run 500km in 3 months',
          target_value: 500,
          current_value: 287,
          metric_type: 'distance',
          scope: 'individual',
          auto_sync: true,
          participant_count: 1,
          activity_count: 34,
          achievement_rules: {
            milestones: [100, 250, 500],
            badges: ['Getting Started', 'Halfway Hero', 'Marathon Ready']
          }
        }
      ];
      
      setStravaGoals(mockStravaGoals);
      
      // Auto-update system goals
      await goalService.updateGoalsAutomatically();
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStravaConnection = async () => {
    // Mock Strava connection check
    // In real implementation, this would check the strava_connections table
    setStravaConnected(true);
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!user?.isAdmin) {
      toast.error('Only admins can create goals');
      return;
    }

    try {
      if (newGoal.isStravaGoal) {
        // Create Strava-integrated goal
        // This would use the enhanced goals service
        toast.success('Strava goal created! (Demo)');
      } else {
        // Create regular goal
        await goalService.createGoal(newGoal, user?.id || user?.email);
      }
      
      setNewGoal({
        title: '',
        description: '',
        targetValue: 0,
        currentValue: 0,
        goalType: 'sessions',
        targetDate: '',
        isStravaGoal: false,
        metricType: 'distance',
        scope: 'individual',
        autoSync: true
      });
      setShowCreateModal(false);
      loadGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleConnectStrava = async () => {
    try {
      // This would initiate the actual Strava OAuth flow
      toast.success('Strava connected! (Demo)');
      setStravaConnected(true);
      setShowStravaConnect(false);
    } catch (error) {
      console.error('Failed to connect Strava:', error);
    }
  };

  const handleSyncStravaData = async () => {
    if (!stravaConnected) {
      toast.error('Please connect to Strava first');
      return;
    }

    try {
      toast.loading('Syncing Strava data...');
      // Mock sync process
      setTimeout(() => {
        toast.dismiss();
        toast.success('Strava data synced! Updated 3 goals.');
        loadGoals();
      }, 2000);
    } catch (error) {
      toast.error('Failed to sync Strava data');
    }
  };

  const filteredGoals = () => {
    switch (activeTab) {
      case 'strava':
        return stravaGoals;
      case 'regular':
        return goals;
      default:
        return [...goals, ...stravaGoals];
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Goals</h1>
          <p className="text-gray-600">Track achievements with Strava integration</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Strava Connection Status */}
          {stravaConnected ? (
            <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="w-4 h-4" />
              <span className="text-sm font-medium">Connected</span>
              <button
                onClick={handleSyncStravaData}
                className="text-orange-600 hover:text-orange-800"
              >
                <SafeIcon icon={FiSettings} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowStravaConnect(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <SafeIcon icon={FiLink} className="w-4 h-4" />
              <span>Connect Strava</span>
            </button>
          )}
          
          {user?.isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <SafeIcon icon={FiPlus} className="w-5 h-5" />
              <span>Create Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'strava', label: 'Strava Goals' },
          { id: 'regular', label: 'Regular Goals' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals().map((goal, index) => (
          goal.metric_type ? (
            // Strava Goal
            <StravaGoalCard 
              key={goal.id} 
              goal={goal} 
              onViewDetails={(goal) => console.log('View Strava goal:', goal)}
            />
          ) : (
            // Regular Goal
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                    <SafeIcon icon={FiTarget} className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                      {goal.goalType}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{goal.description}</p>
              
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">
                    {goal.currentValue} / {goal.targetValue}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300 bg-blue-500"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-blue-600">
                    {goal.progress}% Complete
                  </span>
                  {goal.targetDate && (
                    <span className="text-xs text-gray-500">
                      Due {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900">{goals.length + stravaGoals.length}</p>
            </div>
            <SafeIcon icon={FiTarget} className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Strava Goals</p>
              <p className="text-2xl font-bold text-orange-600">{stravaGoals.length}</p>
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="w-8 h-8" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {[...goals, ...stravaGoals].filter(goal => 
                  (goal.currentValue >= goal.targetValue) || 
                  (goal.current_value >= goal.target_value)
                ).length}
              </p>
            </div>
            <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {[...goals, ...stravaGoals].filter(goal => 
                  (goal.currentValue < goal.targetValue) && 
                  (goal.current_value < goal.target_value)
                ).length}
              </p>
            </div>
            <SafeIcon icon={FiTrendingUp} className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              {/* Goal Type Toggle */}
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newGoal.isStravaGoal}
                    onChange={(e) => setNewGoal({ ...newGoal, isStravaGoal: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Strava-integrated goal</span>
                </label>
                {newGoal.isStravaGoal && (
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="w-4 h-4" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {newGoal.isStravaGoal ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Metric Type</label>
                      <select
                        value={newGoal.metricType}
                        onChange={(e) => setNewGoal({ ...newGoal, metricType: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="distance">Distance</option>
                        <option value="elevation_gain">Elevation</option>
                        <option value="duration">Duration</option>
                        <option value="kudos">Kudos</option>
                        <option value="attempts">Attempts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                      <select
                        value={newGoal.scope}
                        onChange={(e) => setNewGoal({ ...newGoal, scope: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="individual">Individual</option>
                        <option value="pace_group">Pace Group</option>
                        <option value="club">Club</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                  <select
                    value={newGoal.goalType}
                    onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="sessions">Sessions</option>
                    <option value="members">Members</option>
                    <option value="distance">Distance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {newGoal.isStravaGoal && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newGoal.autoSync}
                    onChange={(e) => setNewGoal({ ...newGoal, autoSync: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-sync with Strava</span>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Strava Connect Modal */}
      {showStravaConnect && (
        <StravaConnectModal 
          onClose={() => setShowStravaConnect(false)}
          onConnect={handleConnectStrava}
        />
      )}
    </div>
  );
}

export default Goals;