import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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

  const loginWithEmail = async (email, password) => {
    try {
      // For demo purposes, check if user exists in our database
      const { data: userData, error } = await supabase
        .from('users_rogues_7a9k2m')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !userData) {
        throw new Error('User not found');
      }

      if (!userData.is_approved) {
        toast.error('Your account is pending admin approval');
        return null;
      }

      // Update last active
      await supabase
        .from('users_rogues_7a9k2m')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userData.id);

      const userProfile = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        picture: userData.picture,
        provider: userData.provider,
        isAdmin: userData.is_admin,
        canPublish: userData.can_publish,
        isApproved: userData.is_approved,
        location: userData.location,
        bio: userData.bio,
        joinDate: userData.join_date,
        sessionsAttended: userData.sessions_attended
      };

      setUser(userProfile);
      localStorage.setItem('rogues-user', JSON.stringify(userProfile));
      toast.success('Welcome back!');
      return userProfile;
    } catch (error) {
      toast.error('Login failed: ' + error.message);
      throw error;
    }
  };

  const registerUser = async (userData) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users_rogues_7a9k2m')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('User already exists');
      }

      const { data, error } = await supabase
        .from('users_rogues_7a9k2m')
        .insert([{
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          provider: userData.provider || 'email',
          location: userData.location || 'New York, NY',
          bio: userData.bio || 'New running community member',
          is_approved: userData.provider === 'facebook', // Auto-approve Facebook users
          picture: userData.picture
        }])
        .select()
        .single();

      if (error) throw error;

      const userProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        provider: data.provider,
        isAdmin: data.is_admin,
        canPublish: data.can_publish,
        isApproved: data.is_approved,
        location: data.location,
        bio: data.bio,
        joinDate: data.join_date,
        sessionsAttended: 0,
        picture: data.picture
      };

      if (data.is_approved) {
        setUser(userProfile);
        localStorage.setItem('rogues-user', JSON.stringify(userProfile));
        toast.success('Welcome to Rogues.run!');
      } else {
        toast.success('Registration successful! Awaiting admin approval.');
      }

      return userProfile;
    } catch (error) {
      toast.error('Registration failed: ' + error.message);
      throw error;
    }
  };

  const loginWithFacebook = async (response) => {
    try {
      // Check if user exists
      const { data: existingUser, error } = await supabase
        .from('users_rogues_7a9k2m')
        .select('*')
        .eq('email', response.email)
        .single();

      if (existingUser && !error) {
        // User exists, log them in
        const userProfile = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          picture: existingUser.picture,
          provider: existingUser.provider,
          isAdmin: existingUser.is_admin,
          canPublish: existingUser.can_publish,
          isApproved: existingUser.is_approved,
          location: existingUser.location,
          bio: existingUser.bio,
          joinDate: existingUser.join_date,
          sessionsAttended: existingUser.sessions_attended
        };

        if (!existingUser.is_approved) {
          toast.error('Your account is pending admin approval');
          return null;
        }

        setUser(userProfile);
        localStorage.setItem('rogues-user', JSON.stringify(userProfile));
        toast.success('Welcome back!');
        return userProfile;
      } else {
        // Register new Facebook user
        return registerUser({
          email: response.email,
          name: response.name,
          picture: response.picture?.data?.url,
          provider: 'facebook'
        });
      }
    } catch (error) {
      toast.error('Facebook login failed');
      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber) => {
    try {
      // Check if user exists
      const { data: existingUser, error } = await supabase
        .from('users_rogues_7a9k2m')
        .select('*')
        .eq('phone', phoneNumber)
        .single();

      if (existingUser && !error) {
        if (!existingUser.is_approved) {
          toast.error('Your account is pending admin approval');
          return null;
        }
        
        const userProfile = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          isAdmin: existingUser.is_admin,
          canPublish: existingUser.can_publish,
          isApproved: existingUser.is_approved,
          location: existingUser.location,
          joinDate: existingUser.join_date,
          sessionsAttended: existingUser.sessions_attended
        };

        setUser(userProfile);
        localStorage.setItem('rogues-user', JSON.stringify(userProfile));
        toast.success('Welcome back!');
        return userProfile;
      } else {
        // Register new phone user
        return registerUser({
          email: `${phoneNumber.replace(/\+/g, '')}@phone.user`,
          name: 'Phone User',
          phone: phoneNumber,
          provider: 'phone'
        });
      }
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

  const updateUserProfile = async (updates) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('users_rogues_7a9k2m')
        .update({
          name: updates.name,
          phone: updates.phone,
          location: updates.location,
          bio: updates.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('rogues-user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const approveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users_rogues_7a9k2m')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User approved successfully');
    } catch (error) {
      toast.error('Failed to approve user');
      throw error;
    }
  };

  const togglePublisher = async (userId, canPublish) => {
    try {
      const { error } = await supabase
        .from('users_rogues_7a9k2m')
        .update({ can_publish: !canPublish })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Publisher permissions updated');
    } catch (error) {
      toast.error('Failed to update permissions');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    loginWithEmail,
    loginWithFacebook,
    loginWithPhone,
    registerUser,
    logout,
    updateUserProfile,
    approveUser,
    togglePublisher
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}