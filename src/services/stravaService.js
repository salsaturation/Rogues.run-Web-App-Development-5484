import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const STRAVA_CLIENT_ID = process.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.VITE_STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = `${window.location.origin}/strava-callback`;

export const stravaService = {
  // Strava OAuth
  async initiateStravaAuth() {
    const scope = 'read,activity:read,activity:read_all';
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${STRAVA_REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = url;
  },

  async handleStravaCallback(code, userId) {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code'
        })
      });

      const data = await response.json();
      
      // Store tokens in database
      const { error } = await supabase
        .from('strava_connections_rogues_7a9k2m')
        .upsert({
          user_id: userId,
          strava_athlete_id: data.athlete.id.toString(),
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: new Date(data.expires_at * 1000).toISOString(),
          athlete_data: data.athlete
        });

      if (error) throw error;
      
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
      // Get user's Strava connection
      const { data: connection, error: connError } = await supabase
        .from('strava_connections_rogues_7a9k2m')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (connError) throw connError;

      // Check if token needs refresh
      if (new Date(connection.token_expires_at) <= new Date()) {
        await this.refreshStravaToken(connection);
      }

      // Fetch activities from Strava
      const activities = await this.fetchStravaActivities(connection.access_token, afterDate);

      // Cache activities
      const { error: cacheError } = await supabase
        .from('strava_activities_cache_rogues_7a9k2m')
        .upsert(
          activities.map(activity => ({
            strava_activity_id: activity.id.toString(),
            user_id: userId,
            activity_data: activity,
            processed: false
          }))
        );

      if (cacheError) throw cacheError;

      // Process activities for goals
      await this.processActivitiesForGoals(userId, activities);

      return activities.length;
    } catch (error) {
      console.error('Activity sync error:', error);
      throw error;
    }
  },

  // Goal Progress Tracking
  async processActivitiesForGoals(userId, activities) {
    try {
      // Get active goals that the user is participating in
      const { data: activeGoals, error: goalsError } = await supabase
        .from('enhanced_goals_rogues_7a9k2m')
        .select('*')
        .eq('is_active', true)
        .or(`scope.eq.club,scope.eq.individual,created_by.eq.${userId}`);

      if (goalsError) throw goalsError;

      for (const activity of activities) {
        for (const goal of activeGoals) {
          // Check if activity matches goal criteria
          if (this.activityMatchesGoal(activity, goal)) {
            const contribution = this.calculateGoalContribution(activity, goal);
            
            // Record progress
            await supabase
              .from('goal_progress_rogues_7a9k2m')
              .insert({
                goal_id: goal.id,
                user_id: userId,
                strava_activity_id: activity.id.toString(),
                contribution_value: contribution,
                activity_data: activity
              });

            // Update goal current value
            await supabase
              .from('enhanced_goals_rogues_7a9k2m')
              .update({
                current_value: goal.current_value + contribution,
                updated_at: new Date().toISOString()
              })
              .eq('id', goal.id);

            // Check for achievements
            await this.checkAndAwardAchievements(goal, userId);
          }
        }
      }
    } catch (error) {
      console.error('Goal processing error:', error);
      throw error;
    }
  },

  // Helper Functions
  activityMatchesGoal(activity, goal) {
    // Check activity type
    if (!goal.activity_type.includes(activity.type.toLowerCase())) {
      return false;
    }

    // Check date range if specified
    if (goal.date_range) {
      const activityDate = new Date(activity.start_date);
      const [startDate, endDate] = goal.date_range;
      if (activityDate < new Date(startDate) || activityDate > new Date(endDate)) {
        return false;
      }
    }

    // Check segment if specified
    if (goal.strava_segment_id && !activity.segment_efforts?.some(
      effort => effort.segment.id.toString() === goal.strava_segment_id
    )) {
      return false;
    }

    return true;
  },

  calculateGoalContribution(activity, goal) {
    switch (goal.metric_type) {
      case 'distance':
        return activity.distance / 1000; // Convert to kilometers
      case 'elevation_gain':
        return activity.total_elevation_gain;
      case 'duration':
        return activity.moving_time / 3600; // Convert to hours
      case 'kudos':
        return activity.kudos_count;
      case 'attempts':
        return 1;
      default:
        return 0;
    }
  },

  async checkAndAwardAchievements(goal, userId) {
    try {
      if (!goal.achievement_rules) return;

      const rules = goal.achievement_rules;
      const progress = goal.current_value;

      // Check milestones
      if (rules.milestones) {
        for (const [index, milestone] of rules.milestones.entries()) {
          if (progress >= milestone) {
            // Award badge if not already awarded
            const { data: existing } = await supabase
              .from('goal_achievements_rogues_7a9k2m')
              .select('id')
              .eq('goal_id', goal.id)
              .eq('user_id', userId)
              .eq('achievement_type', rules.badges[index])
              .maybeSingle();

            if (!existing) {
              await supabase
                .from('goal_achievements_rogues_7a9k2m')
                .insert({
                  goal_id: goal.id,
                  user_id: userId,
                  achievement_type: rules.badges[index],
                  achievement_data: {
                    milestone,
                    progress,
                    awarded_for: `Reaching ${milestone} ${goal.metric_type}`
                  }
                });

              toast.success(`Achievement Unlocked: ${rules.badges[index]}!`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Achievement check error:', error);
    }
  },

  // Token Management
  async refreshStravaToken(connection) {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json();

      // Update stored tokens
      await supabase
        .from('strava_connections_rogues_7a9k2m')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: new Date(data.expires_at * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', connection.user_id);

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Strava API Calls
  async fetchStravaActivities(accessToken, afterDate) {
    try {
      const params = new URLSearchParams({
        per_page: 100,
        after: Math.floor(new Date(afterDate).getTime() / 1000)
      });

      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Strava API error:', error);
      throw error;
    }
  }
};

export default stravaService;