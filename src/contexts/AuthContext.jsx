import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "rogues-run-demo.firebaseapp.com",
  projectId: "rogues-run-demo",
  storageBucket: "rogues-run-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('rogues-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginWithFacebook = async (response) => {
    try {
      const userData = {
        id: response.id,
        name: response.name,
        email: response.email,
        picture: response.picture?.data?.url,
        provider: 'facebook',
        isAdmin: response.id === 'admin-id' || response.name === 'Facebook User', // Demo admin check
        canPublish: true,
        joinDate: new Date().toISOString(),
        isApproved: true
      };
      
      setUser(userData);
      localStorage.setItem('rogues-user', JSON.stringify(userData));
      toast.success('Welcome to Rogues.run!');
      return userData;
    } catch (error) {
      toast.error('Facebook login failed');
      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber) => {
    try {
      // Demo phone login - in production, use Firebase Auth
      const userData = {
        id: `phone-${Date.now()}`,
        name: 'Phone User',
        phone: phoneNumber,
        provider: 'phone',
        isAdmin: false,
        canPublish: false,
        joinDate: new Date().toISOString(),
        isApproved: false // Requires admin approval
      };
      
      setUser(userData);
      localStorage.setItem('rogues-user', JSON.stringify(userData));
      toast.success('Phone verification successful! Awaiting admin approval.');
      return userData;
    } catch (error) {
      toast.error('Phone verification failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('rogues-user');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const updateUserProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('rogues-user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    loginWithFacebook,
    loginWithPhone,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}