import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { convertPace, DISTANCE_UNITS } from '../utils/unitConversion';
import { sessionService } from './sessionService';

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

  // Get suggested pace groups for a session
  async getSuggestedPaceGroups(sessionMinPace, sessionMaxPace, distanceUnit) {
    try {
      const allGroups = await this.getStandardPaceGroups();

      let minPaceKm = sessionMinPace;
      let maxPaceKm = sessionMaxPace;

      if (distanceUnit === DISTANCE_UNITS.MILES) {
        minPaceKm = convertPace(sessionMinPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
        maxPaceKm = convertPace(sessionMaxPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }

      const suggestedGroups = allGroups.filter(group => {
        return (group.minPace <= maxPaceKm && group.maxPace >= minPaceKm);
      });

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
          requiredPacers: 1,
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

      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

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
      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

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
            user:users_rogues_7a9k2m(name, email)
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
        pacers: group.pacers?.filter(p => p.role === 'primary').map(p => ({
          userId: p.user_id,
          userName: p.user.name,
          userEmail: p.user.email,
          status: p.status
        })) || [],
        shadowPacers: group.pacers?.filter(p => p.role === 'shadow').map(p => ({
          userId: p.user_id,
          userName: p.user.name,
          userEmail: p.user.email,
          status: p.status
        })) || [],
        pendingVolunteers: group.pacers?.filter(p => p.status === 'pending').map(p => ({
          userId: p.user_id,
          userName: p.user.name,
          userEmail: p.user.email,
          preferredRole: p.role,
          status: p.status
        })) || []
      }));
    } catch (error) {
      console.error('Failed to fetch pace groups:', error);
      return [];
    }
  },

  // Create pace group for session
  async createPaceGroup(groupData) {
    try {
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

  // Get user pacer status for a session
  async getUserPacerStatus(sessionId, userId) {
    try {
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          return {};
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // Get all pace groups for this session and check user's status in each
      const paceGroups = await this.getPaceGroupsBySessionId(sessionId);
      const userStatus = {};

      for (const group of paceGroups) {
        // Check if user is a pacer in this group
        const primaryPacer = group.pacers.find(p => p.userId === userUuid);
        const shadowPacer = group.shadowPacers.find(p => p.userId === userUuid);
        const pendingVolunteer = group.pendingVolunteers.find(p => p.userId === userUuid);

        if (primaryPacer) {
          userStatus[group.id] = { role: 'primary', status: primaryPacer.status };
        } else if (shadowPacer) {
          userStatus[group.id] = { role: 'shadow', status: shadowPacer.status };
        } else if (pendingVolunteer) {
          userStatus[group.id] = { role: pendingVolunteer.preferredRole, status: 'pending' };
        }
      }

      return userStatus;
    } catch (error) {
      console.error('Failed to get user pacer status:', error);
      return {};
    }
  },

  // Volunteer as pacer
  async volunteerAsPacer(sessionId, groupId, userId, role) {
    try {
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id, name')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // First, ensure user is attending the session (auto-register if not)
      try {
        await sessionService.joinSession(sessionId, userUuid);
      } catch (joinError) {
        console.warn('User may already be attending:', joinError);
      }

      // Check if user is already volunteering for this group
      const { data: existing, error: checkError } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .select('id')
        .eq('pace_group_id', groupId)
        .eq('user_id', userUuid)
        .maybeSingle();

      if (existing) {
        toast.info('You are already volunteering for this pace group');
        return;
      }

      // Add as pacer volunteer
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .insert([{
          pace_group_id: groupId,
          user_id: userUuid,
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
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .delete()
        .eq('pace_group_id', groupId)
        .eq('user_id', userUuid);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to cancel pacer volunteer:', error);
      throw error;
    }
  },

  // Approve pacer volunteer (admin/publisher action)
  async approvePacerVolunteer(sessionId, groupId, userId, role) {
    try {
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // Ensure user is attending the session
      try {
        await sessionService.joinSession(sessionId, userUuid);
      } catch (joinError) {
        console.warn('User may already be attending:', joinError);
      }

      // Update pacer status to confirmed
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('pace_group_id', groupId)
        .eq('user_id', userUuid)
        .eq('role', role);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to approve pacer volunteer:', error);
      throw error;
    }
  },

  // Reject pacer volunteer (admin/publisher action)
  async rejectPacerVolunteer(sessionId, groupId, userId) {
    try {
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .delete()
        .eq('pace_group_id', groupId)
        .eq('user_id', userUuid);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to reject pacer volunteer:', error);
      throw error;
    }
  },

  // Remove confirmed pacer (admin action)
  async removePacer(sessionId, groupId, userId) {
    try {
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .delete()
        .eq('pace_group_id', groupId)
        .eq('user_id', userUuid);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to remove pacer:', error);
      throw error;
    }
  },

  // Admin: Assign pacer directly
  async assignPacer(sessionId, groupId, userId, role = 'primary') {
    try {
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('User not found');
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // Ensure user is attending the session
      try {
        await sessionService.joinSession(sessionId, userUuid);
      } catch (joinError) {
        console.warn('User may already be attending:', joinError);
      }

      // Add as confirmed pacer directly
      const { error } = await supabase
        .from('pace_group_pacers_rogues_7a9k2m')
        .upsert({
          pace_group_id: groupId,
          user_id: userUuid,
          role: role,
          status: 'confirmed'
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to assign pacer:', error);
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