import {supabase} from '../lib/supabase';
import toast from 'react-hot-toast';
import {v4 as uuidv4} from 'uuid';

export const templateService = {
  // Get all templates (public + user's private templates)
  async getTemplates(userId = null) {
    try {
      let query = supabase
        .from('session_templates_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email)
        `)
        .order('created_at', {ascending: false});

      // If user is provided, include their private templates
      if (userId) {
        // First check if userId is a valid UUID
        if (this.isValidUUID(userId)) {
          query = query.or(`is_public.eq.true,created_by.eq.${userId}`);
        } else {
          // If not a valid UUID, try to find the user's actual UUID
          const {data: userData, error: userError} = await supabase
            .from('users_rogues_7a9k2m')
            .select('id')
            .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
            .maybeSingle();

          if (userData && !userError) {
            query = query.or(`is_public.eq.true,created_by.eq.${userData.id}`);
          } else {
            // If user not found, just show public templates
            query = query.eq('is_public', true);
          }
        }
      } else {
        query = query.eq('is_public', true);
      }

      const {data, error} = await query;
      if (error) throw error;

      console.log('Templates loaded from database:', data);

      return data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        isPublic: template.is_public,
        createdBy: template.created_by,
        creator: template.creator,
        templateData: template.template_data,
        tags: template.tags || [],
        usageCount: template.usage_count || 0,
        lastUsedAt: template.last_used_at,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to fetch templates');
      throw error;
    }
  },

  // Get template by ID
  async getTemplateById(templateId) {
    try {
      const {data, error} = await supabase
        .from('session_templates_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email)
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        isPublic: data.is_public,
        createdBy: data.created_by,
        creator: data.creator,
        templateData: data.template_data,
        tags: data.tags || [],
        usageCount: data.usage_count || 0,
        lastUsedAt: data.last_used_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Failed to fetch template:', error);
      toast.error('Failed to fetch template');
      throw error;
    }
  },

  // Save session as template
  async saveSessionAsTemplate(sessionData, templateName, templateDescription, isPublic = false, userId, tags = []) {
    try {
      // Ensure userId is valid
      let createdBy;
      if (!this.isValidUUID(userId)) {
        const {data: userData, error: userError} = await supabase
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

      // Prepare template data (exclude session-specific fields)
      const templateData = {
        title: sessionData.title,
        description: sessionData.description,
        time: sessionData.time,
        endTime: sessionData.endTime,
        maxAttendees: sessionData.maxAttendees,
        startLocationName: sessionData.startLocationName,
        startLocationAddress: sessionData.startLocationAddress,
        routeType: sessionData.routeType,
        totalDistance: sessionData.totalDistance,
        runType: sessionData.runType,
        paceMin: sessionData.paceMin,
        paceMax: sessionData.paceMax,
        difficulty: sessionData.difficulty,
        waitlistEnabled: sessionData.waitlistEnabled,
        specialInstructions: sessionData.specialInstructions,
        requiredGear: sessionData.requiredGear || [],
        // Include pace groups if they exist
        paceGroups: sessionData.paceGroups || []
      };

      const {data, error} = await supabase
        .from('session_templates_rogues_7a9k2m')
        .insert([{
          name: templateName,
          description: templateDescription,
          created_by: createdBy,
          is_public: isPublic,
          template_data: templateData,
          tags: tags
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Session saved as template successfully!');
      return data;
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template: ' + error.message);
      throw error;
    }
  },

  // Create session from template
  async createSessionFromTemplate(templateId, sessionOverrides, userId) {
    try {
      // Get template data
      const template = await this.getTemplateById(templateId);

      // Merge template data with overrides
      const sessionData = {
        ...template.templateData,
        ...sessionOverrides,
        // Ensure required fields are set
        date: sessionOverrides.date || new Date().toISOString().split('T')[0],
        location: sessionOverrides.location || template.templateData.startLocationName || 'TBD'
      };

      // Track template usage
      await this.trackTemplateUsage(templateId, userId);

      return sessionData;
    } catch (error) {
      console.error('Failed to create session from template:', error);
      toast.error('Failed to create session from template');
      throw error;
    }
  },

  // Track template usage
  async trackTemplateUsage(templateId, userId, sessionId = null) {
    try {
      // Ensure userId is valid
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const {data: userData, error: userError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          console.warn('User not found for template usage tracking');
          return;
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // Insert usage record
      const {error: usageError} = await supabase
        .from('template_usage_rogues_7a9k2m')
        .insert([{
          template_id: templateId,
          used_by: userUuid,
          session_id: sessionId
        }]);

      if (usageError) {
        console.error('Failed to track template usage:', usageError);
      }

      // Update template usage count and last used date
      const {error: updateError} = await supabase
        .from('session_templates_rogues_7a9k2m')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (updateError) {
        console.error('Failed to update template usage count:', updateError);
      }
    } catch (error) {
      console.error('Error tracking template usage:', error);
    }
  },

  // Update template
  async updateTemplate(templateId, updates, userId) {
    try {
      // Ensure user owns the template or is admin
      const template = await this.getTemplateById(templateId);

      // Get user UUID if needed
      let userUuid = userId;
      if (!this.isValidUUID(userId)) {
        const {data: userData, error: userError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id, is_admin')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
        
        // Check if user is admin or owns the template
        if (template.createdBy !== userUuid && !userData.is_admin) {
          throw new Error('You can only update your own templates or must be an admin');
        }
      } else {
        // Check ownership for UUID users
        if (template.createdBy !== userUuid) {
          // Check if user is admin
          const {data: userData} = await supabase
            .from('users_rogues_7a9k2m')
            .select('is_admin')
            .eq('id', userUuid)
            .single();
          
          if (!userData?.is_admin) {
            throw new Error('You can only update your own templates');
          }
        }
      }

      const {data, error} = await supabase
        .from('session_templates_rogues_7a9k2m')
        .update({
          name: updates.name,
          description: updates.description,
          is_public: updates.isPublic,
          template_data: updates.templateData || template.templateData,
          tags: updates.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Template updated successfully');
      return data;
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template: ' + error.message);
      throw error;
    }
  },

  // Delete template
  async deleteTemplate(templateId, userId) {
    try {
      // Ensure user owns the template or is admin
      const template = await this.getTemplateById(templateId);

      // Get user UUID if needed
      let userUuid = userId;
      if (!this.isValidUUID(userId)) {
        const {data: userData, error: userError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id, is_admin')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
        
        // Check if user is admin or owns the template
        if (template.createdBy !== userUuid && !userData.is_admin) {
          throw new Error('You can only delete your own templates or must be an admin');
        }
      } else {
        // Check ownership for UUID users
        if (template.createdBy !== userUuid) {
          // Check if user is admin
          const {data: userData} = await supabase
            .from('users_rogues_7a9k2m')
            .select('is_admin')
            .eq('id', userUuid)
            .single();
          
          if (!userData?.is_admin) {
            throw new Error('You can only delete your own templates');
          }
        }
      }

      const {error} = await supabase
        .from('session_templates_rogues_7a9k2m')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template: ' + error.message);
      throw error;
    }
  },

  // Get popular templates
  async getPopularTemplates(limit = 5) {
    try {
      const {data, error} = await supabase
        .from('session_templates_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email)
        `)
        .eq('is_public', true)
        .order('usage_count', {ascending: false})
        .limit(limit);

      if (error) throw error;

      return data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        creator: template.creator,
        usageCount: template.usage_count || 0,
        tags: template.tags || []
      }));
    } catch (error) {
      console.error('Failed to fetch popular templates:', error);
      return [];
    }
  },

  // Search templates
  async searchTemplates(query, tags = [], userId = null) {
    try {
      let dbQuery = supabase
        .from('session_templates_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email)
        `);

      // Include public templates and user's private templates
      if (userId) {
        // Check if userId is a valid UUID
        if (this.isValidUUID(userId)) {
          dbQuery = dbQuery.or(`is_public.eq.true,created_by.eq.${userId}`);
        } else {
          // If not a valid UUID, try to find the user's actual UUID
          const {data: userData, error: userError} = await supabase
            .from('users_rogues_7a9k2m')
            .select('id')
            .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
            .maybeSingle();

          if (userData && !userError) {
            dbQuery = dbQuery.or(`is_public.eq.true,created_by.eq.${userData.id}`);
          } else {
            // If user not found, just show public templates
            dbQuery = dbQuery.eq('is_public', true);
          }
        }
      } else {
        dbQuery = dbQuery.eq('is_public', true);
      }

      // Search in name and description
      if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Filter by tags
      if (tags.length > 0) {
        dbQuery = dbQuery.overlaps('tags', tags);
      }

      const {data, error} = await dbQuery.order('usage_count', {ascending: false});
      if (error) throw error;

      return data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        creator: template.creator,
        templateData: template.template_data,
        tags: template.tags || [],
        usageCount: template.usage_count || 0,
        createdAt: template.created_at
      }));
    } catch (error) {
      console.error('Failed to search templates:', error);
      toast.error('Failed to search templates');
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