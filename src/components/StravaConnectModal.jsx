import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiCheck, FiActivity, FiTrendingUp, FiAward } = FiIcons;

function StravaConnectModal({ onClose, onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      onConnect();
      setIsConnecting(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" 
              alt="Strava" 
              className="w-8 h-8"
            />
            <h2 className="text-xl font-bold text-gray-900">Connect to Strava</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-gray-600">
            Connect your Strava account to automatically sync your activities and participate in club challenges!
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">What you'll get:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiActivity} className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Automatic activity tracking for goals</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiTrendingUp} className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Real-time progress updates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiAward} className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-700">Achievement badges and leaderboards</span>
              </div>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Demo Mode:</strong> This is a demonstration of Strava integration. 
              In a real app, this would redirect to Strava's OAuth page.
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiCheck} className="w-5 h-5" />
                <span>Connect with Strava</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By connecting, you agree to share your activity data with Rogues.run
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default StravaConnectModal;