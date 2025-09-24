import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiTarget, FiTrendingUp, FiCalendar, FiCheck, FiEdit, FiTrash2, 
  FiPlus, FiMinus, FiAward, FiActivity
} = FiIcons;

function UserGoalCard({ goal, onUpdateProgress, onEdit, onDelete, onComplete }) {
  const getProgressColor = () => {
    if (goal.progress >= 100) return 'bg-green-500';
    if (goal.progress >= 75) return 'bg-blue-500';
    if (goal.progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      'target': FiTarget,
      'activity': FiActivity,
      'trending-up': FiTrendingUp,
      'award': FiAward
    };
    return iconMap[iconName] || FiTarget;
  };

  const isCompleted = goal.progress >= 100;
  const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && !isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {goal.template?.category && (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${goal.template.category.color || 'blue'}-100`}>
              <SafeIcon 
                icon={getCategoryIcon(goal.template.category.icon)} 
                className={`w-5 h-5 text-${goal.template.category.color || 'blue'}-600`} 
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              {goal.template?.difficulty && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(goal.template.difficulty)}`}>
                  {goal.template.difficulty}
                </span>
              )}
              {goal.template?.category && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {goal.template.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {isCompleted && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <SafeIcon icon={FiCheck} className="w-3 h-3" />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">
            {goal.currentValue} / {goal.targetValue} {goal.metadata?.unit || ''}
          </span>
        </div>
        
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-500`}
            style={{ width: `${Math.min(goal.progress, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
            {goal.progress}% Complete
          </span>
          {goal.targetDate && (
            <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <SafeIcon icon={FiCalendar} className="w-3 h-3" />
              <span className="text-xs">
                {isOverdue ? 'Overdue' : `Due ${new Date(goal.targetDate).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Progress Update */}
      {!isCompleted && (
        <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Quick update:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => onUpdateProgress(goal.id, null, 1)}
              className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              title="Add 1"
            >
              <SafeIcon icon={FiPlus} className="w-3 h-3" />
            </button>
            {goal.currentValue > 0 && (
              <button
                onClick={() => onUpdateProgress(goal.id, null, -1)}
                className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                title="Subtract 1"
              >
                <SafeIcon icon={FiMinus} className="w-3 h-3" />
              </button>
            )}
          </div>
          {goal.progress >= 100 && (
            <button
              onClick={() => onComplete(goal.id)}
              className="ml-auto px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
            >
              Mark Complete
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      {goal.metadata?.instructions && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">{goal.metadata.instructions}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit goal"
          >
            <SafeIcon icon={FiEdit} className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete goal"
          >
            <SafeIcon icon={FiTrash2} className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          Created {new Date(goal.createdAt).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
}

export default UserGoalCard;