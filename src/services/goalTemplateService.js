import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const goalTemplateService = {
  // Get all goal categories with their templates
  async getGoalCategories() {
    try {
      const { data, error } = await supabase
        .from('goal_categories_rogues_7a9k2m')
        .select(`
          *,
          templates:goal_templates_rogues_7a9k2m(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        displayOrder: category.display_order,
        templates: category.templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          targetType: template.target_type,
          defaultTargetValue: template.default_target_value,
          unit: template.unit,
          difficulty: template.difficulty,
          estimatedDuration: template.estimated_duration,
          tags: template.tags || [],
          isPopular: template.is_popular,
          instructions: template.instructions
        }))
      }));
    } catch (error) {
      console.error('Failed to fetch goal categories:', error);
      toast.error('Failed to load goal templates');
      throw error;
    }
  },

  // Get popular goal templates
  async getPopularGoalTemplates(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('goal_templates_rogues_7a9k2m')
        .select(`
          *,
          category:goal_categories_rogues_7a9k2m(name, icon, color)
        `)
        .eq('is_popular', true)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        targetType: template.target_type,
        defaultTargetValue: template.default_target_value,
        unit: template.unit,
        difficulty: template.difficulty,
        estimatedDuration: template.estimated_duration,
        category: template.category,
        usageCount: template.usage_count
      }));
    } catch (error) {
      console.error('Failed to fetch popular goal templates:', error);
      return [];
    }
  },

  // Create goal from template
  async createGoalFromTemplate(templateId, userId, customValues = {}) {
    try {
      console.log('Creating goal from template:', { templateId, userId, customValues });

      // Get template details
      const { data: template, error: templateError } = await supabase
        .from('goal_templates_rogues_7a9k2m')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        console.error('Template error:', templateError);
        throw templateError;
      }

      console.log('Template found:', template);

      // Ensure userId is valid
      let createdBy;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        createdBy = userData.id;
      } else {
        createdBy = userId;
      }

      console.log('User ID resolved to:', createdBy);

      // Ensure target value is numeric
      let targetValue = customValues.targetValue || template.default_target_value;
      if (typeof targetValue === 'string') {
        targetValue = parseFloat(targetValue);
      }
      if (isNaN(targetValue)) {
        throw new Error('Invalid target value');
      }

      // Create goal data
      const goalData = {
        title: customValues.title || template.name,
        description: customValues.description || template.description,
        target_value: targetValue,
        current_value: 0,
        goal_type: template.target_type,
        target_date: customValues.targetDate,
        created_by: createdBy,
        template_id: templateId,
        is_active: true,
        goal_metadata: {
          difficulty: template.difficulty,
          unit: template.unit,
          instructions: template.instructions,
          tags: template.tags || []
        }
      };

      console.log('Goal data to insert:', goalData);

      const { data, error } = await supabase
        .from('goals_rogues_7a9k2m')
        .insert([goalData])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Goal created successfully:', data);

      // Update template usage count
      await supabase
        .from('goal_templates_rogues_7a9k2m')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          last_used_at: new Date().toISOString()
        })
        .eq('id', templateId);

      toast.success('Goal created from template!');
      return data;
    } catch (error) {
      console.error('Failed to create goal from template:', error);
      toast.error('Failed to create goal: ' + error.message);
      throw error;
    }
  },

  // Get user's active goals
  async getUserGoals(userId) {
    try {
      // Ensure userId is valid
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          return [];
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const { data, error } = await supabase
        .from('goals_rogues_7a9k2m')
        .select(`
          *,
          template:goal_templates_rogues_7a9k2m(
            name,
            difficulty,
            unit,
            category:goal_categories_rogues_7a9k2m(name, icon, color)
          )
        `)
        .eq('created_by', userUuid)
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
        progress: Math.round((goal.current_value / goal.target_value) * 100),
        template: goal.template,
        metadata: goal.goal_metadata || {},
        createdAt: goal.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch user goals:', error);
      return [];
    }
  },

  // Update goal progress
  async updateGoalProgress(goalId, newValue, incrementBy = null) {
    try {
      let updateData;
      if (incrementBy !== null) {
        // Increment the current value
        updateData = {
          current_value: supabase.raw(`current_value + ${incrementBy}`),
          updated_at: new Date().toISOString()
        };
      } else {
        // Set the current value
        updateData = {
          current_value: newValue,
          updated_at: new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from('goals_rogues_7a9k2m')
        .update(updateData)
        .eq('id', goalId);

      if (error) throw error;

      toast.success('Goal progress updated!');
      return true;
    } catch (error) {
      console.error('Failed to update goal progress:', error);
      toast.error('Failed to update goal progress');
      throw error;
    }
  },

  // Complete goal
  async completeGoal(goalId) {
    try {
      const { error } = await supabase
        .from('goals_rogues_7a9k2m')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;

      toast.success('🎉 Goal completed! Congratulations!');
      return true;
    } catch (error) {
      console.error('Failed to complete goal:', error);
      toast.error('Failed to complete goal');
      throw error;
    }
  },

  // Helper to validate UUID
  isValidUUID(str) {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
};