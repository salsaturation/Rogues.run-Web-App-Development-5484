import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const memberService = {
  // Get all members
  async getMembers() {
    try {
      const { data, error } = await supabase
        .from('users_rogues_7a9k2m')
        .select('*')
        .order('join_date', { ascending: false });

      if (error) throw error;

      return data.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        picture: member.picture,
        provider: member.provider,
        isAdmin: member.is_admin,
        canPublish: member.can_publish,
        isApproved: member.is_approved,
        location: member.location,
        bio: member.bio,
        joinDate: member.join_date,
        lastActive: member.last_active,
        sessionsAttended: member.sessions_attended || 0
      }));
    } catch (error) {
      toast.error('Failed to fetch members');
      throw error;
    }
  },

  // Approve member
  async approveMember(memberId) {
    try {
      const { error } = await supabase
        .from('users_rogues_7a9k2m')
        .update({ is_approved: true })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Member approved successfully');
    } catch (error) {
      toast.error('Failed to approve member');
      throw error;
    }
  },

  // Reject/Delete member
  async rejectMember(memberId) {
    try {
      const { error } = await supabase
        .from('users_rogues_7a9k2m')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Member rejected');
    } catch (error) {
      toast.error('Failed to reject member');
      throw error;
    }
  },

  // Toggle publisher permissions
  async togglePublisher(memberId, currentStatus) {
    try {
      const { error } = await supabase
        .from('users_rogues_7a9k2m')
        .update({ can_publish: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Publisher permissions updated');
    } catch (error) {
      toast.error('Failed to update permissions');
      throw error;
    }
  },

  // Send invitation
  async sendInvitation(invitationData, invitedBy) {
    try {
      const { data, error } = await supabase
        .from('invitations_rogues_7a9k2m')
        .insert([{
          email: invitationData.email,
          name: invitationData.name,
          phone: invitationData.phone,
          invited_by: invitedBy
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Invitation sent successfully');
      return data;
    } catch (error) {
      toast.error('Failed to send invitation');
      throw error;
    }
  },

  // Get pending invitations
  async getInvitations() {
    try {
      const { data, error } = await supabase
        .from('invitations_rogues_7a9k2m')
        .select(`
          *,
          inviter:users_rogues_7a9k2m!invited_by(name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      toast.error('Failed to fetch invitations');
      throw error;
    }
  }
};