import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const sessionService = {
  // Get all sessions with attendee count
  async getSessions() {
    try {
      const { data: sessions, error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email),
          attendees:session_attendees_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m(name, email)
          )
        `)
        .order('session_date', { ascending: true });

      if (error) throw error;

      return sessions.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        date: session.session_date,
        time: session.session_time,
        location: session.location,
        maxAttendees: session.max_attendees,
        status: session.status,
        createdBy: session.created_by,
        creator: session.creator,
        attendees: session.attendees || [],
        attendeeCount: session.attendees?.length || 0,
        createdAt: session.created_at
      }));
    } catch (error) {
      toast.error('Failed to fetch sessions');
      throw error;
    }
  },

  // Create a new session
  async createSession(sessionData, userId) {
    try {
      const { data, error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .insert([{
          title: sessionData.title,
          description: sessionData.description,
          session_date: sessionData.date,
          session_time: sessionData.time,
          location: sessionData.location,
          max_attendees: sessionData.maxAttendees,
          created_by: userId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Session created successfully!');
      return data;
    } catch (error) {
      toast.error('Failed to create session');
      throw error;
    }
  },

  // Join a session
  async joinSession(sessionId, userId) {
    try {
      // Check if already joined
      const { data: existing } = await supabase
        .from('session_attendees_rogues_7a9k2m')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Leave session
        const { error } = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userId);

        if (error) throw error;
        toast.success('Left session successfully');
        return false; // Not joined
      } else {
        // Join session
        const { error } = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .insert([{
            session_id: sessionId,
            user_id: userId
          }]);

        if (error) throw error;
        
        // Update user's session count
        await supabase.rpc('increment_sessions_attended', { user_id: userId });
        
        toast.success('Joined session successfully');
        return true; // Joined
      }
    } catch (error) {
      toast.error('Failed to update session attendance');
      throw error;
    }
  },

  // Update session
  async updateSession(sessionId, updates) {
    try {
      const { error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .update({
          title: updates.title,
          description: updates.description,
          session_date: updates.date,
          session_time: updates.time,
          location: updates.location,
          max_attendees: updates.maxAttendees,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session updated successfully');
    } catch (error) {
      toast.error('Failed to update session');
      throw error;
    }
  },

  // Delete session
  async deleteSession(sessionId) {
    try {
      const { error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
      throw error;
    }
  },

  // Get user's sessions
  async getUserSessions(userId) {
    try {
      const { data, error } = await supabase
        .from('session_attendees_rogues_7a9k2m')
        .select(`
          session:sessions_rogues_7a9k2m(
            id, title, description, session_date, session_time, location, status
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data.map(item => item.session);
    } catch (error) {
      toast.error('Failed to fetch user sessions');
      throw error;
    }
  }
};