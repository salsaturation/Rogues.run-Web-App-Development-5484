import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const sessionService = {
  // Get all sessions with attendee count
  async getSessions() {
    try {
      const { data: sessions, error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name,email),
          attendees:session_attendees_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m(name,email,picture)
          ),
          interested:session_interested_users_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m(name,email,picture)
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
        endTime: session.end_time,
        location: session.location,
        maxAttendees: session.max_attendees,
        status: session.status,
        createdBy: session.created_by,
        creator: session.creator,
        attendees: session.attendees || [],
        attendeeCount: session.attendees?.length || 0,
        interestedUsers: session.interested || [],
        createdAt: session.created_at,
        // Enhanced fields
        startLocationName: session.start_location_name,
        startLocationLat: session.start_location_lat,
        startLocationLng: session.start_location_lng,
        startLocationAddress: session.start_location_address,
        routeType: session.route_type,
        routeMap: session.route_map,
        totalDistance: session.total_distance,
        runType: session.run_type,
        paceMin: session.pace_min,
        paceMax: session.pace_max,
        difficulty: session.difficulty,
        waitlistEnabled: session.waitlist_enabled,
        specialInstructions: session.special_instructions,
        requiredGear: session.required_gear
      }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to fetch sessions');
      throw error;
    }
  },

  // Get session by ID
  async getSessionById(sessionId) {
    try {
      const { data, error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name,email),
          attendees:session_attendees_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m(name,email,picture)
          ),
          interested:session_interested_users_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m(name,email,picture)
          )
        `)
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.session_date,
        time: data.session_time,
        endTime: data.end_time,
        location: data.location,
        maxAttendees: data.max_attendees,
        status: data.status,
        createdBy: data.created_by,
        creator: data.creator,
        attendees: data.attendees || [],
        attendeeCount: data.attendees?.length || 0,
        interestedUsers: data.interested || [],
        createdAt: data.created_at,
        // Enhanced fields
        startLocationName: data.start_location_name,
        startLocationLat: data.start_location_lat,
        startLocationLng: data.start_location_lng,
        startLocationAddress: data.start_location_address,
        routeType: data.route_type,
        routeMap: data.route_map,
        totalDistance: data.total_distance,
        runType: data.run_type,
        paceMin: data.pace_min,
        paceMax: data.pace_max,
        difficulty: data.difficulty,
        waitlistEnabled: data.waitlist_enabled,
        specialInstructions: data.special_instructions,
        requiredGear: data.required_gear
      };
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      toast.error('Failed to fetch session details');
      throw error;
    }
  },

  // Create a new session
  async createSession(sessionData, userId) {
    try {
      // Make sure userId is a valid UUID
      let createdBy;
      if (!this.isValidUUID(userId)) {
        // Generate a UUID for non-UUID user IDs
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', sessionData.creatorEmail || 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          // If user not found, use a default admin user
          const { data: adminUser } = await supabase
            .from('users_rogues_7a9k2m')
            .select('id')
            .eq('is_admin', true)
            .maybeSingle();

          createdBy = adminUser?.id || uuidv4();
        } else {
          createdBy = userData.id;
        }
      } else {
        createdBy = userId;
      }

      // Prepare gear array if it's a string
      let requiredGear = sessionData.requiredGear;
      if (typeof requiredGear === 'string') {
        try {
          requiredGear = JSON.parse(requiredGear);
        } catch (e) {
          requiredGear = requiredGear ? [requiredGear] : [];
        }
      }

      // Prepare session data for insert
      const sessionInsertData = {
        title: sessionData.title,
        description: sessionData.description,
        session_date: sessionData.date,
        session_time: sessionData.time,
        end_time: sessionData.endTime,
        location: sessionData.location,
        max_attendees: sessionData.maxAttendees,
        created_by: createdBy,
        // Enhanced fields
        start_location_name: sessionData.startLocationName,
        start_location_lat: sessionData.startLocationLat,
        start_location_lng: sessionData.startLocationLng,
        start_location_address: sessionData.startLocationAddress,
        route_type: sessionData.routeType,
        route_map: sessionData.routeMap,
        total_distance: sessionData.totalDistance,
        run_type: sessionData.runType,
        pace_min: sessionData.paceMin,
        pace_max: sessionData.paceMax,
        difficulty: sessionData.difficulty,
        waitlist_enabled: sessionData.waitlistEnabled,
        special_instructions: sessionData.specialInstructions,
        required_gear: requiredGear
      };

      const { data, error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .insert([sessionInsertData])
        .select()
        .single();

      if (error) throw error;
      toast.success('Session created successfully!');
      return data;
    } catch (error) {
      console.error('Session creation error:', error);
      toast.error('Failed to create session: ' + error.message);
      throw error;
    }
  },

  // Join a session
  async joinSession(sessionId, userId) {
    try {
      // Make sure userId is a valid UUID
      let userUuid;
      if (!this.isValidUUID(userId)) {
        // Get the actual UUID for this user from the database
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          // If user not found, create a temporary UUID
          toast.error('User not found in database');
          return false;
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // Check if already joined
      const { data: existing, error: checkError } = await supabase
        .from('session_attendees_rogues_7a9k2m')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userUuid);

      if (checkError) {
        console.error('Error checking attendance:', checkError);
      }

      if (existing && existing.length > 0) {
        // Leave session
        const { error } = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userUuid);

        if (error) throw error;
        toast.success('Left session successfully');
        return false; // Not joined
      } else {
        // Join session
        const { error } = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .insert([{ session_id: sessionId, user_id: userUuid }]);

        if (error) throw error;

        // Update user's session count
        try {
          await supabase.rpc('increment_sessions_attended', { user_id: userUuid });
        } catch (rpcError) {
          console.error('Failed to update session count:', rpcError);
          // Continue even if this fails
        }

        toast.success('Joined session successfully');
        return true; // Joined
      }
    } catch (error) {
      console.error('Session joining error:', error);
      toast.error('Failed to update session attendance: ' + error.message);
      throw error;
    }
  },

  // Toggle interest in a session
  async toggleInterest(sessionId, userId) {
    try {
      // Make sure userId is a valid UUID
      let userUuid;
      if (!this.isValidUUID(userId)) {
        // Get the actual UUID for this user from the database
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          toast.error('User not found in database');
          return false;
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      // Check if already interested
      const { data: existing, error: checkError } = await supabase
        .from('session_interested_users_rogues_7a9k2m')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userUuid);

      if (checkError) {
        console.error('Error checking interest:', checkError);
      }

      if (existing && existing.length > 0) {
        // Remove interest
        const { error } = await supabase
          .from('session_interested_users_rogues_7a9k2m')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userUuid);

        if (error) throw error;
        toast.success('Removed from interested list');
        return false; // Not interested
      } else {
        // Add interest
        const { error } = await supabase
          .from('session_interested_users_rogues_7a9k2m')
          .insert([{ session_id: sessionId, user_id: userUuid }]);

        if (error) throw error;
        toast.success('Added to interested list');
        return true; // Interested
      }
    } catch (error) {
      console.error('Toggle interest error:', error);
      toast.error('Failed to update interest status: ' + error.message);
      throw error;
    }
  },

  // Check if user is interested in session
  async isUserInterested(sessionId, userId) {
    try {
      // Make sure userId is a valid UUID
      let userUuid;
      if (!this.isValidUUID(userId)) {
        // Get the actual UUID for this user from the database
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) return false;
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const { data, error } = await supabase
        .from('session_interested_users_rogues_7a9k2m')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userUuid);

      if (error) {
        console.error('Error checking interest:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking interest:', error);
      return false;
    }
  },

  // Update session
  async updateSession(sessionId, updates) {
    try {
      // Prepare gear array if it's a string
      let requiredGear = updates.requiredGear;
      if (typeof requiredGear === 'string') {
        try {
          requiredGear = JSON.parse(requiredGear);
        } catch (e) {
          requiredGear = requiredGear ? [requiredGear] : [];
        }
      }

      const { error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .update({
          title: updates.title,
          description: updates.description,
          session_date: updates.date,
          session_time: updates.time,
          end_time: updates.endTime,
          location: updates.location,
          max_attendees: updates.maxAttendees,
          updated_at: new Date().toISOString(),
          // Enhanced fields
          start_location_name: updates.startLocationName,
          start_location_lat: updates.startLocationLat,
          start_location_lng: updates.startLocationLng,
          start_location_address: updates.startLocationAddress,
          route_type: updates.routeType,
          route_map: updates.routeMap,
          total_distance: updates.totalDistance,
          run_type: updates.runType,
          pace_min: updates.paceMin,
          pace_max: updates.paceMax,
          difficulty: updates.difficulty,
          waitlist_enabled: updates.waitlistEnabled,
          special_instructions: updates.specialInstructions,
          required_gear: requiredGear
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session updated successfully');
    } catch (error) {
      console.error('Failed to update session:', error);
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
      console.error('Failed to delete session:', error);
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
            id,
            title,
            description,
            session_date,
            session_time,
            location,
            status
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data.map(item => item.session);
    } catch (error) {
      console.error('Failed to fetch user sessions:', error);
      toast.error('Failed to fetch user sessions');
      throw error;
    }
  },

  // Find sessions matching user pace preferences
  async findSessionsByPacePreferences(userId) {
    try {
      // Direct approach - get all sessions and filter manually
      // First get user's pace preferences
      const { data: userData, error: userError } = await supabase
        .from('users_rogues_7a9k2m')
        .select('pace_preferences')
        .eq('id', userId)
        .single();

      if (userError || !userData || !userData.pace_preferences || userData.pace_preferences.length === 0) {
        console.log("No pace preferences found for user:", userId);
        return [];
      }

      const pacePreferences = userData.pace_preferences;
      console.log("User pace preferences:", pacePreferences);

      // Get upcoming sessions
      const { data: sessions, error } = await supabase
        .from('sessions_rogues_7a9k2m')
        .select('*')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error) {
        console.error("Error fetching sessions:", error);
        throw error;
      }

      console.log("Found sessions:", sessions.length);

      // Filter sessions by matching pace preferences
      const matchedSessions = sessions.filter(session => {
        // Skip sessions without pace info
        if (!session.pace_min || !session.pace_max) return false;

        return pacePreferences.some(pref => {
          const prefPace = parseFloat(pref.pace);
          // Match by pace range and optionally run type
          const matchesPace = prefPace >= session.pace_min && prefPace <= session.pace_max;
          const matchesType = !session.run_type || !pref.runType || session.run_type === pref.runType;
          
          return matchesPace && matchesType;
        });
      });

      console.log("Matched sessions:", matchedSessions.length);

      return matchedSessions.map(session => ({
        id: session.id,
        title: session.title,
        date: session.session_date,
        time: session.session_time,
        runType: session.run_type,
        paceMin: session.pace_min,
        paceMax: session.pace_max
      }));
    } catch (error) {
      console.error('Failed to match sessions by pace:', error);
      return [];
    }
  },

  // Get session comments
  async getSessionComments(sessionId) {
    try {
      const { data, error } = await supabase
        .from('session_comments_rogues_7a9k2m')
        .select(`
          *,
          user:users_rogues_7a9k2m!user_id(name,email,picture)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch session comments:', error);
      return [];
    }
  },

  // Add comment to session
  async addComment(sessionId, userId, content) {
    try {
      // Make sure userId is a valid UUID
      let userUuid;
      if (!this.isValidUUID(userId)) {
        // Get the actual UUID for this user from the database
        const { data: userData, error: userError } = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          toast.error('User not found in database');
          return false;
        }
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const { error } = await supabase
        .from('session_comments_rogues_7a9k2m')
        .insert([{
          session_id: sessionId,
          user_id: userUuid,
          content: content
        }]);

      if (error) throw error;
      toast.success('Comment added successfully');
      return true;
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
      return false;
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