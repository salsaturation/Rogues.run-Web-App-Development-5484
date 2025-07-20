import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { settingsService } from './settingsService';

export const stravaService = {
  // Check if Strava is configured and connected
  async checkConnectionStatus() {
    try {
      // Get Strava config from club settings
      const clubSettings = await settingsService.getClubSettings();
      const stravaConfig = clubSettings.stravaConfig || {};
      
      // Check for user-specific connection in localStorage (for demo)
      const userConnected = window.localStorage.getItem('strava_demo_connected') === 'true';
      
      // If no client ID is configured, Strava is not configured
      if (!stravaConfig.clientId) {
        return { status: 'not_configured' };
      }
      
      // If client ID exists but user is not connected, user needs to authorize
      if (!userConnected) {
        return { status: 'needs_auth' };
      }
      
      // User is connected
      return { status: 'connected' };
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      return { status: 'error', error: error.message };
    }
  },

  // Strava OAuth
  async initiateStravaAuth() {
    try {
      // Get Strava config
      const clubSettings = await settingsService.getClubSettings();
      const stravaConfig = clubSettings.stravaConfig || {};
      
      if (!stravaConfig.clientId) {
        toast.error('Strava Client ID not configured');
        return false;
      }
      
      const redirectUri = `${window.location.origin}/strava-callback`;
      const scope = 'read,activity:read,activity:read_all';
      const url = `https://www.strava.com/oauth/authorize?client_id=${stravaConfig.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
      
      // In a real app, this would redirect to Strava
      // For demo, we'll simulate success
      window.localStorage.setItem('strava_demo_connected', 'true');
      toast.success('Demo: Strava connected successfully!');
      return true;
    } catch (error) {
      console.error('Error initiating Strava auth:', error);
      toast.error('Failed to connect to Strava');
      return false;
    }
  },

  async handleStravaCallback(code, userId) {
    try {
      // Get Strava config
      const clubSettings = await settingsService.getClubSettings();
      const stravaConfig = clubSettings.stravaConfig || {};
      
      if (!stravaConfig.clientId || !stravaConfig.clientSecret) {
        toast.error('Strava API credentials not configured');
        return false;
      }
      
      // In a real app, this would exchange the code for tokens
      // For demo, we'll simulate success
      
      // Store connection in database
      const { error } = await supabase
        .from('strava_connections_rogues_7a9k2m')
        .upsert({
          user_id: userId,
          strava_athlete_id: 'demo_athlete_id',
          access_token: 'demo_access_token',
          refresh_token: 'demo_refresh_token',
          token_expires_at: new Date(Date.now() + 21600000).toISOString(), // 6 hours from now
          athlete_data: { id: 'demo_athlete_id', firstname: 'Demo', lastname: 'User' }
        });

      if (error) throw error;

      // For demo
      window.localStorage.setItem('strava_demo_connected', 'true');
      
      toast.success('Successfully connected to Strava!');
      return true;
    } catch (error) {
      console.error('Strava auth error:', error);
      toast.error('Failed to connect to Strava');
      return false;
    }
  },

  // Activity Syncing
  async syncStravaActivities(userId, afterDate) {
    try {
      // Check if Strava is connected
      const connectionStatus = await this.checkConnectionStatus();
      if (connectionStatus.status !== 'connected') {
        throw new Error('Strava not connected');
      }
      
      // In a real app, this would fetch activities from Strava
      // For demo, we'll simulate success
      toast.success('Synced Strava activities successfully');
      
      return 5; // Number of activities synced
    } catch (error) {
      console.error('Activity sync error:', error);
      toast.error('Failed to sync Strava activities');
      throw error;
    }
  },

  // For demo purposes - simulate connecting to Strava
  async connectStrava() {
    try {
      // Store in localStorage for demo
      window.localStorage.setItem('strava_demo_connected', 'true');
      
      // Update Strava config to show as connected
      const clubSettings = await settingsService.getClubSettings();
      const stravaConfig = {
        ...clubSettings.stravaConfig,
        connectionVerified: true,
        lastConnected: new Date().toISOString()
      };
      
      // Update club settings
      await settingsService.updateClubSettings({
        ...clubSettings,
        stravaConfig
      });
      
      toast.success('Connected to Strava successfully!');
      return true;
    } catch (error) {
      console.error('Failed to connect to Strava:', error);
      toast.error('Failed to connect to Strava');
      return false;
    }
  },

  // For demo purposes - simulate disconnecting from Strava
  async disconnectStrava() {
    try {
      // Remove from localStorage for demo
      window.localStorage.removeItem('strava_demo_connected');
      
      // Update Strava config to show as disconnected
      const clubSettings = await settingsService.getClubSettings();
      const stravaConfig = {
        ...clubSettings.stravaConfig,
        connectionVerified: false
      };
      
      // Update club settings
      await settingsService.updateClubSettings({
        ...clubSettings,
        stravaConfig
      });
      
      toast.success('Disconnected from Strava');
      return true;
    } catch (error) {
      console.error('Failed to disconnect from Strava:', error);
      toast.error('Failed to disconnect from Strava');
      return false;
    }
  }
};

export default stravaService;