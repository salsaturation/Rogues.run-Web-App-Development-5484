import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const goalService = {
  // Get all goals
  async getGoals() {
    try {
      const { data, error } = await supabase
        .from('goals_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        targetValue: goal.target_value,
        currentValue: goal.current_value,
        goalType: goal.goal_type,
        targetDate: goal.target_date,
        isActive: goal.is_active,
        progress: Math.round((goal.current_value / goal.target_value) * 100),
        createdBy: goal.created_by,
        creator: goal.creator,
        createdAt: goal.created_at
      }));
    } catch (error) {
      toast.error('Failed to fetch goals');
      throw error;
    }
  },

  // Create new goal
  async createGoal(goalData, userId) {
    try {
      // Make sure userId is a valid UUID
      let createdBy;
      
      if (!this.isValidUUID(userId)) {
        // Get the actual UUID for this user from the database
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', 'admin@rogues.run')
          .single();
          
        if (userError || !userData) {
          // If user not found, use a default UUID
          createdBy = uuidv4();
        } else {
          createdBy = userData.id;
        }
      } else {
        createdBy = userId;
      }

      const { data, error } = await supabase
        .from('goals_rogues_7a9k2m')
        .insert([{
          title: goalData.title,
          description: goalData.description,
          target_value: goalData.targetValue,
          current_value: goalData.currentValue || 0,
          goal_type: goalData.goalType,
          target_date: goalData.targetDate,
          created_by: createdBy
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Goal created successfully!');
      return data;
    } catch (error) {
      console.error('Goal creation error:', error);
      toast.error('Failed to create goal: ' + error.message);
      throw error;
    }
  },

  // Update goal progress
  async updateGoalProgress(goalId, newValue) {
    try {
      const { error } = await supabase
        .from('goals_rogues_7a9k2m')
        .update({
          current_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
      toast.success('Goal progress updated');
    } catch (error) {
      toast.error('Failed to update goal progress');
      throw error;
    }
  },

  // Delete goal
  async deleteGoal(goalId) {
    try {
      const { error } = await supabase
        .from('goals_rogues_7a9k2m')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;
      toast.success('Goal archived');
    } catch (error) {
      toast.error('Failed to archive goal');
      throw error;
    }
  },

  // Auto-update goals based on system metrics
  async updateGoalsAutomatically() {
    try {
      // Update member count goals
      const { data: memberCount } = await supabase
        .from('users_rogues_7a9k2m')
        .select('id', { count: 'exact' })
        .eq('is_approved', true);

      await supabase
        .from('goals_rogues_7a9k2m')
        .update({ current_value: memberCount?.length || 0 })
        .eq('goal_type', 'members')
        .eq('is_active', true);

      // Update session count goals
      const { data: sessionCount } = await supabase
        .from('sessions_rogues_7a9k2m')
        .select('id', { count: 'exact' });

      await supabase
        .from('goals_rogues_7a9k2m')
        .update({ current_value: sessionCount?.length || 0 })
        .eq('goal_type', 'sessions')
        .eq('is_active', true);
    } catch (error) {
      console.error('Failed to auto-update goals:', error);
    }
  },
  
  // Helper to validate UUID
  isValidUUID(str) {
    if (!str) return false;
    
    // UUID v4 regex pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
};