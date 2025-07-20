import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { convertPace, DISTANCE_UNITS } from '../utils/unitConversion';

export const paceGroupService = {
  // Get all standard pace groups
  async getStandardPaceGroups() {
    try {
      const { data, error } = await supabase
        .from('standard_pace_groups_rogues_7a9k2m')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data.map(group => ({
        id: group.id,
        name: group.name,
        minPace: group.min_pace,
        maxPace: group.max_pace,
        description: group.description,
        color: group.color,
        icon: group.icon,
        displayOrder: group.display_order,
        isActive: group.is_active,
        createdBy: group.created_by,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch standard pace groups:', error);
      toast.error('Failed to fetch pace groups');
      throw error;
    }
  },

  // Get suggested pace groups for a session - fallback method that doesn't rely on the Supabase function
  async getSuggestedPaceGroups(sessionMinPace, sessionMaxPace, distanceUnit) {
    try {
      // Get all standard pace groups first
      const allGroups = await this.getStandardPaceGroups();

      // If the paces are in miles, convert to km for comparison
      let minPaceKm = sessionMinPace;
      let maxPaceKm = sessionMaxPace;
      
      if (distanceUnit === DISTANCE_UNITS.MILES) {
        minPaceKm = convertPace(sessionMinPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
        maxPaceKm = convertPace(sessionMaxPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }

      // Filter groups manually
      const suggestedGroups = allGroups.filter(group => {
        // Check if there's any overlap between session pace and group pace
        return (group.minPace <= maxPaceKm && group.maxPace >= minPaceKm);
      });

      // Convert the pace values back to the user's preferred unit
      return suggestedGroups.map(group => {
        let minPaceDisplay = group.minPace;
        let maxPaceDisplay = group.maxPace;
        
        if (distanceUnit === DISTANCE_UNITS.MILES) {
          minPaceDisplay = convertPace(group.minPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
          maxPaceDisplay = convertPace(group.maxPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
        }
        
        return {
          id: group.id,
          name: group.name,
          minPace: minPaceDisplay,
          maxPace: maxPaceDisplay,
          description: group.description,
          color: group.color,
          icon: group.icon,
          requiredPacers: 1, // Default values for session pace groups
          shadowSlots: 1
        };
      });
    } catch (error) {
      console.error('Failed to get suggested pace groups:', error);
      return [];
    }
  },

  // Create standard pace group
  async createStandardPaceGroup(groupData, userId) {
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
          throw new Error('User not found');
        }
        
        createdBy = userData.id;
      } else {
        createdBy = userId;
      }

      // Handle numeric fields - convert empty strings to null
      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      // Make sure the pace values are in kilometers for storage
      const minPace = cleanNumericField(groupData.minPace);
      const maxPace = cleanNumericField(groupData.maxPace);

      const { data, error } = await supabase
        .from('standard_pace_groups_rogues_7a9k2m')
        .insert([{
          name: groupData.name,
          min_pace: minPace,
          max_pace: maxPace,
          description: groupData.description,
          color: groupData.color,
          icon: groupData.icon,
          display_order: groupData.displayOrder,
          is_active: groupData.isActive !== false,
          created_by: createdBy
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Standard pace group created successfully');
      return data;
    } catch (error) {
      console.error('Failed to create standard pace group:', error);
      toast.error('Failed to create standard pace group');
      throw error;
    }
  },

  // Update standard pace group
  async updateStandardPaceGroup(groupId, groupData) {
    try {
      // Handle numeric fields - convert empty strings to null
      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      // Make sure the pace values are in kilometers for storage
      const minPace = cleanNumericField(groupData.minPace);
      const maxPace = cleanNumericField(groupData.maxPace);

      const { error } = await supabase
        .from('standard_pace_groups_rogues_7a9k2m')
        .update({
          name: groupData.name,
          min_pace: minPace,
          max_pace: maxPace,
          description: groupData.description,
          color: groupData.color,
          icon: groupData.icon,
          display_order: groupData.displayOrder,
          is_active: groupData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Standard pace group updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update standard pace group:', error);
      toast.error('Failed to update standard pace group');
      throw error;
    }
  },

  // Delete standard pace group
  async deleteStandardPaceGroup(groupId) {
    try {
      const { error } = await supabase
        .from('standard_pace_groups_rogues_7a9k2m')
        .update({ is_active: false })
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Pace group deleted successfully');
    } catch (error) {
      console.error('Failed to delete pace group:', error);
      toast.error('Failed to delete pace group');
      throw error;
    }
  },

  // Get pace groups for a specific session
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
            user:users_rogues_7a9k2m(name,email)
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(group => ({
        id: group.id,
        sessionId: group.session_id,
        name: group.name,
        minPace: group.min_pace,
        maxPace: group.max_pace,
        description: group.description,
        requiredPacers: group.required_pacers,
        shadowSlots: group.shadow_slots,
        pacers: group.pacers?.filter(p => p.role === 'primary') || [],
        shadowPacers: group.pacers?.filter(p => p.role === 'shadow') || [],
        pendingVolunteers: []
      }));
    } catch (error) {
      console.error('Failed to fetch pace groups:', error);
      return [];
    }
  },

  // Create pace group for session
  async createPaceGroup(groupData) {
    try {
      // Handle numeric fields - convert empty strings to null
      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      const { data, error } = await supabase
        .from('pace_groups_rogues_7a9k2m')
        .insert([{
          session_id: groupData.sessionId,
          name: groupData.name,
          min_pace: cleanNumericField(groupData.minPace),
          max_pace: cleanNumericField(groupData.maxPace),
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
      throw error;
    }
  },

  // Delete pace group
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
        // Return default settings if none exist
        return {
          pacerRoleTitle: 'Pacer',
          shadowRoleTitle: 'Shadow Pacer',
          allowMultiGroupVolunteering: true,
          autoAssignPacers: true,
          requireApproval: true
        };
      }

      return {
        pacerRoleTitle: data.pacer_role_title,
        shadowRoleTitle: data.shadow_role_title,
        allowMultiGroupVolunteering: data.allow_multi_group_volunteering,
        autoAssignPacers: data.auto_assign_pacers,
        requireApproval: data.require_approval
      };
    } catch (error) {
      console.error('Failed to get pacer settings:', error);
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
        .upsert({
          id: 1,
          pacer_role_title: settings.pacerRoleTitle,
          shadow_role_title: settings.shadowRoleTitle,
          allow_multi_group_volunteering: settings.allowMultiGroupVolunteering,
          auto_assign_pacers: settings.autoAssignPacers,
          require_approval: settings.requireApproval,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update pacer settings:', error);
      throw error;
    }
  },

  // Get user pacer status
  async getUserPacerStatus(sessionId, userId) {
    try {
      // This would fetch user's pacer volunteer status
      return {
        isVolunteering: false,
        preferredGroups: [],
        preferredRoles: [],
        status: 'none'
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
  },

  // Volunteer as pacer
  async volunteerAsPacer(sessionId, groupId, userId, role) {
    try {
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .insert([{
          pace_group_id: groupId,
          user_id: userId,
          role: role,
          status: 'pending'
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to volunteer as pacer:', error);
      throw error;
    }
  },

  // Cancel pacer volunteer
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
      console.error('Failed to cancel pacer volunteer:', error);
      throw error;
    }
  },

  // Approve pacer volunteer
  async approvePacerVolunteer(sessionId, groupId, userId, role) {
    try {
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .update({ status: 'confirmed' })
        .eq('pace_group_id', groupId)
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to approve pacer volunteer:', error);
      throw error;
    }
  },

  // Reject pacer volunteer
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
      console.error('Failed to reject pacer volunteer:', error);
      throw error;
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