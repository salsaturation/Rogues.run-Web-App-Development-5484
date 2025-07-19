import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { goalService } from '../services/goalService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const {
  FiTarget, FiPlus, FiEdit, FiTrash2, FiCalendar, FiTrendingUp,
  FiUsers, FiActivity, FiAward, FiCheckCircle
} = FiIcons;

function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    goalType: 'sessions',
    targetDate: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalService.getGoals();
      setGoals(data);
      
      // Auto-update system goals
      await goalService.updateGoalsAutomatically();
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!user?.isAdmin) {
      toast.error('Only admins can create goals');
      return;
    }

    try {
      await goalService.createGoal(newGoal, user.id);
      setNewGoal({
        title: '',
        description: '',
        targetValue: 0,
        currentValue: 0,
        goalType: 'sessions',
        targetDate: ''
      });
      setShowCreateModal(false);
      loadGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleUpdateProgress = async (goalId, newValue) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can update goal progress');
      return;
    }

    try {
      await goalService.updateGoalProgress(goalId, newValue);
      loadGoals();
    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can delete goals');
      return;
    }

    if (window.confirm('Are you sure you want to archive this goal?')) {
      try {
        await goalService.deleteGoal(goalId);
        loadGoals();
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'members': return FiUsers;
      case 'sessions': return FiActivity;
      case 'distance': return FiTrendingUp;
      default: return FiTarget;
    }
  };

  const getGoalTypeColor = (type) => {
    switch (type) {
      case 'members': return 'blue';
      case 'sessions': return 'green';
      case 'distance': return 'purple';
      default: return 'gray';
    }
  };

  const isGoalCompleted = (goal) => goal.currentValue >= goal.targetValue;
  const isGoalOverdue = (goal) => goal.targetDate && new Date(goal.targetDate) < new Date();

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
          <p className="text-gray-600">Track and achieve community milestones</p>
        </div>
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

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 ${
              isGoalCompleted(goal) 
                ? 'border-green-500' 
                : isGoalOverdue(goal) 
                ? 'border-red-500' 
                : 'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${getGoalTypeColor(goal.goalType)}-100`}>
                  <SafeIcon icon={getGoalTypeIcon(goal.goalType)} className={`w-6 h-6 text-${getGoalTypeColor(goal.goalType)}-600`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    goal.goalType === 'members' ? 'bg-blue-100 text-blue-800' :
                    goal.goalType === 'sessions' ? 'bg-green-100 text-green-800' :
                    goal.goalType === 'distance' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.goalType}
                  </span>
                </div>
              </div>
              {isGoalCompleted(goal) && (
                <SafeIcon icon={FiCheckCircle} className="w-6 h-6 text-green-500" />
              )}
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
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isGoalCompleted(goal) ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm font-medium ${
                  isGoalCompleted(goal) ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {goal.progress}% Complete
                </span>
                {goal.targetDate && (
                  <span className={`text-xs ${
                    isGoalOverdue(goal) ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    Due {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {user?.isAdmin && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newValue = prompt('Enter new progress value:', goal.currentValue);
                      if (newValue !== null && !isNaN(newValue)) {
                        handleUpdateProgress(goal.id, parseInt(newValue));
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Update progress"
                  >
                    <SafeIcon icon={FiEdit} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Archive goal"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  By {goal.creator?.name}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiTarget} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals set yet</h3>
          <p className="text-gray-500">Create your first community goal to get started</p>
        </div>
      )}

      {/* Goal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
            </div>
            <SafeIcon icon={FiTarget} className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {goals.filter(goal => isGoalCompleted(goal)).length}
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
                {goals.filter(goal => !isGoalCompleted(goal)).length}
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
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                  <select
                    value={newGoal.goalType}
                    onChange={(e) => setNewGoal({...newGoal, goalType: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="sessions">Sessions</option>
                    <option value="members">Members</option>
                    <option value="distance">Distance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({...newGoal, targetValue: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    value={newGoal.currentValue}
                    onChange={(e) => setNewGoal({...newGoal, currentValue: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
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
    </div>
  );
}

export default Goals;