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
  }
};