import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const paceGroupService = {
  // Get pace groups for a session
  async getPaceGroupsBySessionId(sessionId) {
    try {
      const { data, error } = await supabase
        .from('pace_groups_rogues_7a9k2m')
        .select(`
          *,
          pacers:pace_group_pacers_rogues_7a9k2m(
            user_id,
            role,
            status,
            user:users_rogues_7a9k2m(name, email, picture)
          )
        `)
        .eq('session_id', sessionId)
        .order('min_pace', { ascending: true });

      if (error) throw error;

      return data.map(group => {
        // Filter pacers by role
        const allPacers = group.pacers || [];
        
        return {
          id: group.id,
          sessionId: group.session_id,
          name: group.name,
          minPace: group.min_pace,
          maxPace: group.max_pace,
          description: group.description,
          requiredPacers: group.required_pacers,
          shadowSlots: group.shadow_slots,
          createdAt: group.created_at,
          
          // Primary pacers (role = 'primary')
          pacers: allPacers
            .filter(p => p.role === 'primary')
            .map(p => ({
              userId: p.user_id,
              userName: p.user?.name,
              userPicture: p.user?.picture,
              status: p.status
            })),
            
          // Shadow pacers (role = 'shadow')
          shadowPacers: allPacers
            .filter(p => p.role === 'shadow')
            .map(p => ({
              userId: p.user_id,
              userName: p.user?.name,
              userPicture: p.user?.picture,
              status: p.status
            })),
            
          // Pending volunteer requests
          pendingVolunteers: allPacers
            .filter(p => p.status === 'pending')
            .map(p => ({
              userId: p.user_id,
              userName: p.user?.name,
              userPicture: p.user?.picture,
              preferredRole: p.role
            }))
        };
      });
    } catch (error) {
      console.error('Failed to fetch pace groups:', error);
      toast.error('Failed to fetch pace groups');
      throw error;
    }
  },

  // Create a new pace group
  async createPaceGroup(groupData) {
    try {
      const { data, error } = await supabase
        .from('pace_groups_rogues_7a9k2m')
        .insert([{
          session_id: groupData.sessionId,
          name: groupData.name,
          min_pace: groupData.minPace,
          max_pace: groupData.maxPace,
          description: groupData.description,
          required_pacers: groupData.requiredPacers,
          shadow_slots: groupData.shadowSlots
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create pace group:', error);
      toast.error('Failed to create pace group');
      throw error;
    }
  },

  // Update an existing pace group
  async updatePaceGroup(groupId, groupData) {
    try {
      const { error } = await supabase
        .from('pace_groups_rogues_7a9k2m')
        .update({
          name: groupData.name,
          min_pace: groupData.minPace,
          max_pace: groupData.maxPace,
          description: groupData.description,
          required_pacers: groupData.requiredPacers,
          shadow_slots: groupData.shadowSlots,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update pace group:', error);
      toast.error('Failed to update pace group');
      throw error;
    }
  },

  // Delete a pace group
  async deletePaceGroup(groupId) {
    try {
      const { error } = await supabase
        .from('pace_groups_rogues_7a9k2m')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete pace group:', error);
      toast.error('Failed to delete pace group');
      throw error;
    }
  },

  // Volunteer as a pacer for a specific group
  async volunteerAsPacer(sessionId, groupId, userId, role = 'primary') {
    try {
      // Ensure role is valid
      if (!['primary', 'shadow'].includes(role)) {
        role = 'primary';
      }
      
      // Check if already volunteered for this group
      const { data: existingRequest, error: checkError } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .select('id')
        .eq('pace_group_id', groupId)
        .eq('user_id', userId);
        
      if (checkError) throw checkError;
      
      if (existingRequest && existingRequest.length > 0) {
        throw new Error('You have already volunteered for this pace group');
      }

      // Get session settings to determine if auto-approval is enabled
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions_rogues_7a9k2m')
        .select('require_pacer_approval')
        .eq('id', sessionId)
        .single();
        
      if (sessionError) throw sessionError;
      
      const requireApproval = sessionData?.require_pacer_approval !== false;
      
      // Insert the volunteer request
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .insert([{
          pace_group_id: groupId,
          user_id: userId,
          role: role,
          status: requireApproval ? 'pending' : 'confirmed',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to volunteer as pacer:', error);
      toast.error(error.message || 'Failed to volunteer as pacer');
      throw error;
    }
  },

  // Cancel a pacer volunteer request
  async cancelPacerVolunteer(sessionId, groupId, userId) {
    try {
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .delete()
        .eq('pace_group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to cancel volunteer request:', error);
      toast.error('Failed to cancel volunteer request');
      throw error;
    }
  },

  // Approve a pacer volunteer request
  async approvePacerVolunteer(sessionId, groupId, userId, role) {
    try {
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .update({
          status: 'confirmed',
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('pace_group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to approve volunteer:', error);
      toast.error('Failed to approve volunteer');
      throw error;
    }
  },

  // Reject a pacer volunteer request
  async rejectPacerVolunteer(sessionId, groupId, userId) {
    try {
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .delete()
        .eq('pace_group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to reject volunteer:', error);
      toast.error('Failed to reject volunteer');
      throw error;
    }
  },

  // Get pacer settings
  async getPacerSettings() {
    try {
      const { data, error } = await supabase
        .from('pacer_settings_rogues_7a9k2m')
        .select('*')
        .single();

      if (error) {
        // If no settings exist, create default settings
        if (error.code === 'PGRST116') {
          const defaultSettings = {
            pacer_role_title: 'Pacer',
            shadow_role_title: 'Shadow Pacer',
            allow_multi_group_volunteering: true,
            auto_assign_pacers: true,
            require_approval: true
          };
          
          await supabase
            .from('pacer_settings_rogues_7a9k2m')
            .insert([defaultSettings]);
            
          return {
            pacerRoleTitle: defaultSettings.pacer_role_title,
            shadowRoleTitle: defaultSettings.shadow_role_title,
            allowMultiGroupVolunteering: defaultSettings.allow_multi_group_volunteering,
            autoAssignPacers: defaultSettings.auto_assign_pacers,
            requireApproval: defaultSettings.require_approval
          };
        }
        throw error;
      }

      return {
        pacerRoleTitle: data.pacer_role_title,
        shadowRoleTitle: data.shadow_role_title,
        allowMultiGroupVolunteering: data.allow_multi_group_volunteering,
        autoAssignPacers: data.auto_assign_pacers,
        requireApproval: data.require_approval
      };
    } catch (error) {
      console.error('Failed to fetch pacer settings:', error);
      // Return default settings
      return {
        pacerRoleTitle: 'Pacer',
        shadowRoleTitle: 'Shadow Pacer',
        allowMultiGroupVolunteering: true,
        autoAssignPacers: true,
        requireApproval: true
      };
    }
  },

  // Update pacer settings
  async updatePacerSettings(settings) {
    try {
      const { error } = await supabase
        .from('pacer_settings_rogues_7a9k2m')
        .upsert([{
          id: 1, // Single row for settings
          pacer_role_title: settings.pacerRoleTitle,
          shadow_role_title: settings.shadowRoleTitle,
          allow_multi_group_volunteering: settings.allowMultiGroupVolunteering,
          auto_assign_pacers: settings.autoAssignPacers,
          require_approval: settings.requireApproval,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('Pacer settings updated');
      return true;
    } catch (error) {
      console.error('Failed to update pacer settings:', error);
      toast.error('Failed to update pacer settings');
      throw error;
    }
  },

  // Volunteer for multiple pace groups
  async volunteerForMultipleGroups(sessionId, userId, groupIds, preferredRoles, notes) {
    try {
      if (!groupIds || groupIds.length === 0) {
        throw new Error('No pace groups selected');
      }
      
      if (!preferredRoles || preferredRoles.length === 0) {
        throw new Error('No roles selected');
      }
      
      // Create a multi-group volunteer request
      const { data: requestData, error: requestError } = await supabase
        .from('pacer_volunteer_requests_rogues_7a9k2m')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          pace_group_ids: groupIds,
          preferred_roles: preferredRoles,
          notes: notes,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (requestError) throw requestError;
      
      // If auto-assign is enabled, create tentative assignments
      const { data: settingsData } = await supabase
        .from('pacer_settings_rogues_7a9k2m')
        .select('auto_assign_pacers, require_approval')
        .single();
        
      const autoAssign = settingsData?.auto_assign_pacers !== false;
      const requireApproval = settingsData?.require_approval !== false;
      
      if (autoAssign) {
        // Create tentative assignments for each group
        const pacerAssignments = groupIds.map(groupId => ({
          pace_group_id: groupId,
          user_id: userId,
          role: preferredRoles.includes('primary') ? 'primary' : 'shadow',
          status: requireApproval ? 'tentative' : 'confirmed',
          volunteer_request_id: requestData.id,
          created_at: new Date().toISOString()
        }));
        
        const { error: assignError } = await supabase
          .from('pace_group_pacers_rogues_7a9k2m')
          .insert(pacerAssignments);
          
        if (assignError) throw assignError;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to submit volunteer request:', error);
      toast.error(error.message || 'Failed to submit volunteer request');
      throw error;
    }
  },

  // Get user's pacer status for a session
  async getUserPacerStatus(sessionId, userId) {
    try {
      // Check for direct assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .select(`
          *,
          pace_group:pace_groups_rogues_7a9k2m(id, name)
        `)
        .eq('user_id', userId)
        .filter('pace_group.session_id', 'eq', sessionId);
        
      if (assignmentsError) throw assignmentsError;
      
      // Check for volunteer requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('pacer_volunteer_requests_rogues_7a9k2m')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (requestsError) throw requestsError;
      
      // Determine overall status
      let isVolunteering = false;
      let preferredGroups = [];
      let preferredRoles = [];
      let status = 'none';
      
      if (assignmentsData && assignmentsData.length > 0) {
        isVolunteering = true;
        
        // Get confirmed or tentative assignments
        const confirmedAssignments = assignmentsData.filter(a => 
          a.status === 'confirmed' || a.status === 'tentative'
        );
        
        if (confirmedAssignments.length > 0) {
          status = confirmedAssignments[0].status;
          preferredGroups = confirmedAssignments.map(a => a.pace_group.id);
          preferredRoles = [...new Set(confirmedAssignments.map(a => a.role))];
        } else {
          // If only pending assignments
          status = 'pending';
          preferredGroups = assignmentsData.map(a => a.pace_group.id);
          preferredRoles = [...new Set(assignmentsData.map(a => a.role))];
        }
      } else if (requestsData && requestsData.length > 0) {
        // No direct assignments but has volunteer request
        isVolunteering = true;
        status = requestsData[0].status;
        preferredGroups = requestsData[0].pace_group_ids || [];
        preferredRoles = requestsData[0].preferred_roles || [];
      }
      
      return {
        isVolunteering,
        preferredGroups,
        preferredRoles,
        status
      };
    } catch (error) {
      console.error('Failed to get user pacer status:', error);
      return {
        isVolunteering: false,
        preferredGroups: [],
        preferredRoles: [],
        status: 'none'
      };
    }
  }
};