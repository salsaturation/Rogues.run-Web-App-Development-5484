import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-number-input';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import 'react-phone-number-input/style.css';

const { FiActivity, FiPhone, FiCheck } = FiIcons;

function Login() {
  const { loginWithFacebook, loginWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('login'); // 'login', 'verify'
  const [loading, setLoading] = useState(false);

  // Custom Facebook Login implementation
  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      // Demo Facebook response - in production, replace with actual Facebook SDK
      const demoResponse = {
        id: 'facebook_user_' + Date.now(),
        name: 'Facebook User',
        email: 'facebook.user@example.com',
        picture: {
          data: {
            url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          }
        },
        accessToken: 'demo_access_token'
      };
      
      await loginWithFacebook(demoResponse);
    } catch (error) {
      console.error('Facebook login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    try {
      await loginWithPhone(phoneNumber);
      setStep('verify');
    } catch (error) {
      console.error('Phone login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    // Demo verification - in production, verify with Firebase
    if (verificationCode === '123456') {
      setStep('success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 running-animation">
              <SafeIcon icon={FiActivity} className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rogues.run</h1>
            <p className="text-gray-600">Join the running community</p>
          </div>

          {step === 'login' && (
            <div className="space-y-6">
              {/* Facebook Login */}
              <button
                onClick={handleFacebookLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connecting...' : 'Continue with Facebook'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Phone Login */}
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!phoneNumber || loading}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiPhone} className="w-5 h-5" />
                  <span>{loading ? 'Sending...' : 'Continue with Phone'}</span>
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center">
                New phone users require admin approval to join the community.
              </p>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Verify Your Phone
                </h2>
                <p className="text-gray-600">
                  We've sent a verification code to {phoneNumber}
                </p>
              </div>

              <form onSubmit={handleVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                    placeholder="123456"
                    maxLength="6"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verificationCode.length !== 6 || loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center">
                Demo code: 123456
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <SafeIcon icon={FiCheck} className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome to Rogues.run!
              </h2>
              <p className="text-gray-600">
                Your account is being reviewed by our admin team.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Login;