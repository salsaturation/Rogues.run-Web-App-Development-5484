import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { DISTANCE_UNITS } from '../utils/unitConversion';

export const settingsService = {
  // Get club settings
  async getClubSettings() {
    try {
      const { data, error } = await supabase
        .from('club_settings_rogues_7a9k2m')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching club settings:', error);
        // Return default settings
        return {
          clubName: 'Rogues.run',
          clubTagline: 'Join the Running Revolution',
          clubMotto: 'Every step counts, every mile matters',
          clubLogo: '',
          clubFavicon: '',
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          description: 'A community of passionate runners pushing boundaries together.',
          website: '',
          distanceUnit: DISTANCE_UNITS.KILOMETERS,
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
            strava: ''
          }
        };
      }

      return {
        clubName: data.club_name,
        clubTagline: data.club_tagline,
        clubMotto: data.club_motto,
        clubLogo: data.club_logo,
        clubFavicon: data.club_favicon,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        description: data.description,
        website: data.website,
        distanceUnit: data.distance_unit || DISTANCE_UNITS.KILOMETERS,
        socialMedia: data.social_media || {
          facebook: '',
          instagram: '',
          twitter: '',
          strava: ''
        }
      };
    } catch (error) {
      console.error('Failed to fetch club settings:', error);
      // Return default settings on error
      return {
        clubName: 'Rogues.run',
        clubTagline: 'Join the Running Revolution',
        clubMotto: 'Every step counts, every mile matters',
        clubLogo: '',
        clubFavicon: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        description: 'A community of passionate runners pushing boundaries together.',
        website: '',
        distanceUnit: DISTANCE_UNITS.KILOMETERS,
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          strava: ''
        }
      };
    }
  },

  // Update club settings
  async updateClubSettings(settings) {
    try {
      const { error } = await supabase
        .from('club_settings_rogues_7a9k2m')
        .upsert({
          id: 1, // Single row for settings
          club_name: settings.clubName,
          club_tagline: settings.clubTagline,
          club_motto: settings.clubMotto,
          club_logo: settings.clubLogo,
          club_favicon: settings.clubFavicon,
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor,
          description: settings.description,
          website: settings.website,
          distance_unit: settings.distanceUnit || DISTANCE_UNITS.KILOMETERS,
          social_media: settings.socialMedia,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating settings:', error);
        throw error;
      }

      toast.success('Settings updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update club settings:', error);
      toast.error('Failed to update settings');
      throw error;
    }
  },

  // Get user-specific settings
  async getUserSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('users_rogues_7a9k2m')
        .select('user_preferences')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user settings:', error);
        return { distanceUnit: null }; // Default to null (use club settings)
      }

      // Return user preferences, defaulting to empty object with null distanceUnit
      return data.user_preferences || { distanceUnit: null };
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      return { distanceUnit: null };
    }
  },

  // Update user-specific settings
  async updateUserSettings(userId, settings) {
    try {
      // First, get current user preferences
      const { data, error: fetchError } = await supabase
        .from('users_rogues_7a9k2m')
        .select('user_preferences')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching user settings:', fetchError);
        throw fetchError;
      }

      // Merge existing preferences with new settings
      const currentPreferences = data?.user_preferences || {};
      const updatedPreferences = { ...currentPreferences, ...settings };

      // Update the user preferences
      const { error: updateError } = await supabase
        .from('users_rogues_7a9k2m')
        .update({ 
          user_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user settings:', updateError);
        throw updateError;
      }

      toast.success('Your preferences have been updated');
      return true;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      toast.error('Failed to update your preferences');
      throw error;
    }
  }
};