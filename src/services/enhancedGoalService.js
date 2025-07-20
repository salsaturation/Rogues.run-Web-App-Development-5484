import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const enhancedGoalService = {
  // Get all enhanced goals with Strava integration
  async getEnhancedGoals() {
    try {
      const { data, error } = await supabase
        .from('enhanced_goals_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email),
          pace_group:pace_groups_rogues_7a9k2m(name),
          progress:goal_progress_rogues_7a9k2m(contribution_value)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        goalType: goal.goal_type,
        targetValue: goal.target_value,
        currentValue: goal.current_value,
        metricType: goal.metric_type,
        activityType: goal.activity_type,
        dateRange: goal.date_range,
        scope: goal.scope,
        paceGroupId: goal.pace_group_id,
        createdBy: goal.created_by,
        isActive: goal.is_active,
        autoSync: goal.auto_sync,
        achievementRules: goal.achievement_rules,
        stravaSegmentId: goal.strava_segment_id,
        stravaRouteId: goal.strava_route_id,
        stravaClubId: goal.strava_club_id,
        creator: goal.creator,
        paceGroup: goal.pace_group,
        progress: goal.progress,
        createdAt: goal.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch enhanced goals:', error);
      toast.error('Failed to fetch goals');
      throw error;
    }
  },

  // Create new enhanced goal with Strava integration
  async createEnhancedGoal(goalData, userId) {
    try {
      // Ensure userId is valid
      let createdBy;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          createdBy = uuidv4();
        } else {
          createdBy = userData.id;
        }
      } else {
        createdBy = userId;
      }

      const { data, error } = await supabase
        .from('enhanced_goals_rogues_7a9k2m')
        .insert([{
          title: goalData.title,
          description: goalData.description,
          goal_type: goalData.goalType,
          target_value: goalData.targetValue,
          current_value: goalData.currentValue || 0,
          metric_type: goalData.metricType,
          activity_type: goalData.activityType || ['run'],
          date_range: goalData.dateRange,
          scope: goalData.scope,
          pace_group_id: goalData.paceGroupId,
          created_by: createdBy,
          auto_sync: goalData.autoSync !== false,
          achievement_rules: goalData.achievementRules,
          strava_segment_id: goalData.stravaSegmentId,
          strava_route_id: goalData.stravaRouteId,
          strava_club_id: goalData.stravaClubId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Enhanced goal created successfully!');
      return data;
    } catch (error) {
      console.error('Enhanced goal creation error:', error);
      toast.error('Failed to create goal: ' + error.message);
      throw error;
    }
  },

  // Update goal progress (usually called by Strava sync)
  async updateGoalProgress(goalId, contributionValue, userId, stravaActivityId, activityData) {
    try {
      // Record the progress entry
      const { error: progressError } = await supabase
        .from('goal_progress_rogues_7a9k2m')
        .insert([{
          goal_id: goalId,
          user_id: userId,
          strava_activity_id: stravaActivityId,
          contribution_value: contributionValue,
          activity_data: activityData
        }]);

      if (progressError) throw progressError;

      // Update the goal's current value
      const { error: updateError } = await supabase
        .from('enhanced_goals_rogues_7a9k2m')
        .update({
          current_value: supabase.raw('current_value + ?', [contributionValue]),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Failed to update goal progress:', error);
      throw error;
    }
  },

  // Get goal leaderboard
  async getGoalLeaderboard(goalId) {
    try {
      const { data, error } = await supabase
        .from('goal_progress_rogues_7a9k2m')
        .select(`
          user_id,
          user:users_rogues_7a9k2m(name, picture),
          contribution_value
        `)
        .eq('goal_id', goalId);

      if (error) throw error;

      // Aggregate contributions by user
      const userTotals = {};
      data.forEach(entry => {
        const userId = entry.user_id;
        if (!userTotals[userId]) {
          userTotals[userId] = {
            user: entry.user,
            total: 0,
            activities: 0
          };
        }
        userTotals[userId].total += entry.contribution_value;
        userTotals[userId].activities++;
      });

      // Convert to array and sort
      const leaderboard = Object.values(userTotals)
        .sort((a, b) => b.total - a.total)
        .map((entry, index) => ({
          rank: index + 1,
          name: entry.user.name,
          avatar: entry.user.picture,
          value: entry.total,
          activities: entry.activities
        }));

      return leaderboard;
    } catch (error) {
      console.error('Failed to get goal leaderboard:', error);
      return [];
    }
  },

  // Get recent activities for a goal
  async getGoalActivities(goalId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('goal_progress_rogues_7a9k2m')
        .select(`
          *,
          user:users_rogues_7a9k2m(name)
        `)
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(entry => ({
        id: entry.id,
        user: entry.user.name,
        type: entry.activity_data?.type || 'Run',
        distance: entry.activity_data?.distance ? entry.activity_data.distance / 1000 : 0,
        elevation: entry.activity_data?.total_elevation_gain || 0,
        date: new Date(entry.created_at).toLocaleDateString(),
        time: entry.activity_data?.moving_time ? this.formatDuration(entry.activity_data.moving_time) : '0:00',
        kudos: entry.activity_data?.kudos_count || 0
      }));
    } catch (error) {
      console.error('Failed to get goal activities:', error);
      return [];
    }
  },

  // Award achievement
  async awardAchievement(goalId, userId, achievementType, achievementData) {
    try {
      // Check if already awarded
      const { data: existing } = await supabase
        .from('goal_achievements_rogues_7a9k2m')
        .select('id')
        .eq('goal_id', goalId)
        .eq('user_id', userId)
        .eq('achievement_type', achievementType)
        .maybeSingle();

      if (existing) return false; // Already awarded

      const { error } = await supabase
        .from('goal_achievements_rogues_7a9k2m')
        .insert([{
          goal_id: goalId,
          user_id: userId,
          achievement_type: achievementType,
          achievement_data: achievementData
        }]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to award achievement:', error);
      return false;
    }
  },

  // Helper functions
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },

  isValidUUID(str) {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
};