import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { goalService } from '../services/goalService';
import { goalTemplateService } from '../services/goalTemplateService';
import { stravaService } from '../services/stravaService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import StravaGoalCard from '../components/StravaGoalCard';
import StravaGoalDetails from '../components/StravaGoalDetails';
import StravaConnectModal from '../components/StravaConnectModal';
import GoalTemplateSelector from '../components/GoalTemplateSelector';
import UserGoalCard from '../components/UserGoalCard';
import toast from 'react-hot-toast';

const {
  FiTarget, FiPlus, FiEdit, FiTrash2, FiCalendar, FiTrendingUp, FiUsers, 
  FiActivity, FiAward, FiCheckCircle, FiLink, FiSettings, FiRefreshCw,
  FiStar, FiList
} = FiIcons;

function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [userGoals, setUserGoals] = useState([]);
  const [stravaGoals, setStravaGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-goals'); // 'my-goals', 'templates', 'strava', 'community'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showStravaConnect, setShowStravaConnect] = useState(false);
  const [showStravaGoalDetails, setShowStravaGoalDetails] = useState(false);
  const [selectedStravaGoal, setSelectedStravaGoal] = useState(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaConnectionStatus, setStravaConnectionStatus] = useState('not_configured');
  const [popularTemplates, setPopularTemplates] = useState([]);

  // Legacy goal creation state
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
    loadUserGoals();
    loadPopularTemplates();
    checkStravaConnection();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      // Load regular goals
      const regularGoals = await goalService.getGoals();
      setGoals(regularGoals);

      // Load Strava goals (mock data for now)
      if (stravaConnected) {
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
          }
        ];
        setStravaGoals(mockStravaGoals);
      } else {
        setStravaGoals([]);
      }

      // Auto-update system goals
      await goalService.updateGoalsAutomatically();
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGoals = async () => {
    try {
      if (user?.id) {
        const userGoalsData = await goalTemplateService.getUserGoals(user.id);
        setUserGoals(userGoalsData);
      }
    } catch (error) {
      console.error('Failed to load user goals:', error);
    }
  };

  const loadPopularTemplates = async () => {
    try {
      const templates = await goalTemplateService.getPopularGoalTemplates(6);
      setPopularTemplates(templates);
    } catch (error) {
      console.error('Failed to load popular templates:', error);
    }
  };

  const checkStravaConnection = async () => {
    try {
      const connectionStatus = await stravaService.checkConnectionStatus();
      setStravaConnectionStatus(connectionStatus.status);
      setStravaConnected(connectionStatus.status === 'connected');
    } catch (error) {
      console.error('Failed to check Strava connection:', error);
      setStravaConnectionStatus('error');
      setStravaConnected(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!user?.isAdmin) {
      toast.error('Only admins can create community goals');
      return;
    }

    try {
      if (newGoal.isStravaGoal) {
        if (!stravaConnected) {
          toast.error('Please connect to Strava before creating Strava goals');
          return;
        }
        toast.success('Strava goal created! (Demo)');
      } else {
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
      toast.success('Strava connected! (Demo)');
      setStravaConnected(true);
      setStravaConnectionStatus('connected');
      setShowStravaConnect(false);
      loadGoals();
    } catch (error) {
      console.error('Failed to connect Strava:', error);
      toast.error('Failed to connect to Strava');
    }
  };

  const handleUpdateProgress = async (goalId, newValue, incrementBy = null) => {
    try {
      await goalTemplateService.updateGoalProgress(goalId, newValue, incrementBy);
      loadUserGoals();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      await goalTemplateService.completeGoal(goalId);
      loadUserGoals();
    } catch (error) {
      console.error('Failed to complete goal:', error);
    }
  };

  const handleDeleteUserGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await goalService.deleteGoal(goalId);
      loadUserGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleViewStravaGoalDetails = (goal) => {
    setSelectedStravaGoal(goal);
    setShowStravaGoalDetails(true);
  };

  const renderStravaConnectionStatus = () => {
    switch (stravaConnectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        );
      case 'not_configured':
        return (
          <button
            onClick={() => {
              if (user?.isAdmin) {
                toast.info('Please configure Strava integration in Admin Panel first');
                setTimeout(() => { window.location.href = '#/admin'; }, 2000);
              } else {
                toast.error('Strava integration has not been configured by an admin');
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <SafeIcon icon={FiSettings} className="w-4 h-4" />
            <span>Configure Strava</span>
          </button>
        );
      case 'needs_auth':
        return (
          <button
            onClick={() => setShowStravaConnect(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <SafeIcon icon={FiLink} className="w-4 h-4" />
            <span>Connect Strava</span>
          </button>
        );
      default:
        return (
          <button
            onClick={() => {
              if (user?.isAdmin) {
                toast.info('Please configure Strava integration in Admin Panel first');
                setTimeout(() => { window.location.href = '#/admin'; }, 2000);
              } else {
                toast.error('Strava integration has not been configured by an admin');
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiLink} className="w-4 h-4" />
            <span>Strava Status Unknown</span>
          </button>
        );
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
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-600">Track your running goals and achievements</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Strava Connection Status */}
          {renderStravaConnectionStatus()}
          
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-5 h-5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('my-goals')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'my-goals' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Goals ({userGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'templates' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiStar} className="w-4 h-4" />
            <span>Popular Templates</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'community' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Community Goals
        </button>
        <button
          onClick={() => setActiveTab('strava')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'strava' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="w-4 h-4" />
          <span>Strava Goals</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-goals' && (
        <div className="space-y-6">
          {userGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGoals.map((goal) => (
                <UserGoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={handleUpdateProgress}
                  onEdit={() => {}} // TODO: Implement edit
                  onDelete={handleDeleteUserGoal}
                  onComplete={handleCompleteGoal}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <SafeIcon icon={FiTarget} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No personal goals yet</h3>
              <p className="text-gray-500 mb-6">Set your first goal to start tracking your progress</p>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Popular Goal Templates</h2>
            <p className="text-gray-600">Choose from our most popular pre-made goals</p>
          </div>
          
          {popularTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${template.category?.color || 'blue'}-100`}>
                      <SafeIcon icon={FiTarget} className={`w-5 h-5 text-${template.category?.color || 'blue'}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {template.usageCount} users completed
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      Try this goal →
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <SafeIcon icon={FiStar} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
              <p className="text-gray-500">Check back later for goal templates</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'community' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length > 0 ? (
            goals.map((goal, index) => (
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
            ))
          ) : (
            <div className="col-span-1 md:col-span-3 text-center py-12 bg-gray-50 rounded-xl">
              <SafeIcon icon={FiTarget} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No community goals yet</h3>
              <p className="text-gray-500 mb-4">Community goals will appear here when created by admins</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'strava' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stravaGoals.length > 0 ? (
            stravaGoals.map((goal, index) => (
              <StravaGoalCard
                key={goal.id}
                goal={goal}
                onViewDetails={handleViewStravaGoalDetails}
              />
            ))
          ) : (
            <div className="col-span-1 md:col-span-3 text-center py-12 bg-gray-50 rounded-xl">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Strava Goals Yet</h3>
              {stravaConnected ? (
                <p className="text-gray-500 mb-4">Strava goals will appear here when created</p>
              ) : (
                <p className="text-gray-500 mb-4">Connect to Strava to access activity-based goals</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Goal Template Selector Modal */}
      <GoalTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onGoalCreated={() => {
          loadUserGoals();
          setShowTemplateSelector(false);
        }}
      />

      {/* Strava Connect Modal */}
      {showStravaConnect && (
        <StravaConnectModal
          onClose={() => setShowStravaConnect(false)}
          onConnect={handleConnectStrava}
        />
      )}

      {/* Strava Goal Details Modal */}
      {showStravaGoalDetails && selectedStravaGoal && (
        <StravaGoalDetails
          goal={selectedStravaGoal}
          onClose={() => setShowStravaGoalDetails(false)}
        />
      )}
    </div>
  );
}

export default Goals;