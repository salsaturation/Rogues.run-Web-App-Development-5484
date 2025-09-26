import {supabase} from '../lib/supabase';
import toast from 'react-hot-toast';
import {v4 as uuidv4} from 'uuid';
import {paceGroupService} from './paceGroupService';

export const sessionService = {
  // Get all sessions with attendee count
  async getSessions() {
    try {
      const {data: sessions, error} = await supabase
        .from('sessions_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email),
          attendees:session_attendees_rogues_7a9k2m(
            user_id,
            status,
            user:users_rogues_7a9k2m!session_attendees_rogues_7a9k2m_user_id_fkey(name, email, picture)
          ),
          interested:session_interested_users_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m!session_interested_users_rogues_7a9k2m_user_id_fkey(name, email, picture)
          )
        `)
        .order('session_date', {ascending: true});

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
        completedAt: session.completed_at,
        completionNotes: session.completion_notes,
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
      const {data, error} = await supabase
        .from('sessions_rogues_7a9k2m')
        .select(`
          *,
          creator:users_rogues_7a9k2m!created_by(name, email),
          attendees:session_attendees_rogues_7a9k2m(
            user_id,
            status,
            attended,
            admin_processed,
            self_reported,
            self_reported_attended,
            user:users_rogues_7a9k2m!session_attendees_rogues_7a9k2m_user_id_fkey(name, email, picture)
          ),
          interested:session_interested_users_rogues_7a9k2m(
            user_id,
            user:users_rogues_7a9k2m!session_interested_users_rogues_7a9k2m_user_id_fkey(name, email, picture)
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
        completedAt: data.completed_at,
        completionNotes: data.completion_notes,
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

  // Mark session as completed
  async markSessionComplete(sessionId, completionData) {
    try {
      const {error} = await supabase
        .from('sessions_rogues_7a9k2m')
        .update({
          status: 'completed',
          completed_at: completionData.completedAt,
          completion_notes: completionData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to mark session as completed:', error);
      throw error;
    }
  },

  // Get session attendance data - FIXED VERSION
  async getSessionAttendance(sessionId) {
    try {
      // Use the custom function we created
      const {data, error} = await supabase
        .rpc('get_session_attendance_data', {session_uuid: sessionId});

      if (error) {
        console.error('RPC function error, falling back to direct query:', error);
        
        // Fallback to direct query
        const {data: fallbackData, error: fallbackError} = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .select(`
            user_id,
            status,
            joined_at,
            attended,
            admin_processed,
            self_reported,
            self_reported_attended,
            self_reported_at,
            confirmed_at,
            user:users_rogues_7a9k2m!session_attendees_rogues_7a9k2m_user_id_fkey(
              id,
              name,
              email,
              picture
            ),
            confirmed_by_user:users_rogues_7a9k2m!session_attendees_rogues_7a9k2m_confirmed_by_fkey(
              name,
              email
            )
          `)
          .eq('session_id', sessionId);

        if (fallbackError) throw fallbackError;

        const attendees = (fallbackData || []).map(attendee => ({
          userId: attendee.user_id,
          user: attendee.user,
          status: attendee.status || 'registered',
          joinedAt: attendee.joined_at,
          attended: attendee.attended,
          adminProcessed: attendee.admin_processed || false,
          selfReported: attendee.self_reported || false,
          selfReportedAttended: attendee.self_reported_attended,
          selfReportedAt: attendee.self_reported_at,
          confirmedBy: attendee.confirmed_by_user,
          confirmedAt: attendee.confirmed_at
        }));

        return {attendees};
      }

      // Process RPC function results
      const attendees = (data || []).map(row => ({
        userId: row.user_id,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          picture: row.user_picture
        },
        status: row.status || 'registered',
        joinedAt: row.joined_at,
        attended: row.attended,
        adminProcessed: row.admin_processed || false,
        selfReported: row.self_reported || false,
        selfReportedAttended: row.self_reported_attended,
        selfReportedAt: row.self_reported_at,
        confirmedBy: row.confirmed_by_name ? {name: row.confirmed_by_name} : null,
        confirmedAt: row.confirmed_at
      }));

      return {attendees};
    } catch (error) {
      console.error('Failed to fetch session attendance:', error);
      // Return empty structure to prevent crashes
      return {attendees: []};
    }
  },

  // Self-report attendance - ENHANCED VERSION
  async selfReportAttendance(sessionId, userId, attended) {
    try {
      // Make sure userId is a valid UUID
      let userUuid;
      if (!this.isValidUUID(userId)) {
        const {data: userData, error: userError} = await supabase
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

      // Check if user is already in attendees table
      const {data: existingAttendee, error: checkError} = await supabase
        .from('session_attendees_rogues_7a9k2m')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userUuid)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAttendee) {
        // Update existing attendee record
        const {error} = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .update({
            self_reported: true,
            self_reported_attended: attended,
            self_reported_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('user_id', userUuid);

        if (error) throw error;
      } else {
        // Create new attendee record for interested user
        const {error} = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .insert({
            session_id: sessionId,
            user_id: userUuid,
            status: 'interested', // Special status for self-reporting interested users
            joined_at: new Date().toISOString(),
            self_reported: true,
            self_reported_attended: attended,
            self_reported_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to self-report attendance:', error);
      throw error;
    }
  },

  // Confirm attendance (admin/publisher action)
  async confirmAttendance(sessionId, userId, attended, confirmedBy) {
    try {
      // Make sure userIds are valid UUIDs
      let userUuid, confirmedByUuid;
      
      if (!this.isValidUUID(userId)) {
        const {data: userData, error: userError} = await supabase
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

      if (!this.isValidUUID(confirmedBy)) {
        const {data: confirmerData, error: confirmerError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', confirmedBy.includes('@') ? confirmedBy : 'admin@rogues.run')
          .maybeSingle();

        if (confirmerError || !confirmerData) {
          throw new Error('Confirmer not found');
        }
        confirmedByUuid = confirmerData.id;
      } else {
        confirmedByUuid = confirmedBy;
      }

      const {error} = await supabase
        .from('session_attendees_rogues_7a9k2m')
        .update({
          attended: attended,
          admin_processed: true,
          confirmed_by: confirmedByUuid,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userUuid);

      if (error) throw error;

      // Update user's session count if they attended
      if (attended) {
        try {
          await supabase.rpc('increment_sessions_attended', {user_id: userUuid});
        } catch (rpcError) {
          console.error('Failed to update session count:', rpcError);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to confirm attendance:', error);
      throw error;
    }
  },

  // Bulk confirm attendance
  async bulkConfirmAttendance(sessionId, userIds, attended, confirmedBy) {
    try {
      // Make sure confirmedBy is a valid UUID
      let confirmedByUuid;
      if (!this.isValidUUID(confirmedBy)) {
        const {data: confirmerData, error: confirmerError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', confirmedBy.includes('@') ? confirmedBy : 'admin@rogues.run')
          .maybeSingle();

        if (confirmerError || !confirmerData) {
          throw new Error('Confirmer not found');
        }
        confirmedByUuid = confirmerData.id;
      } else {
        confirmedByUuid = confirmedBy;
      }

      // Process each user individually to handle UUID conversion
      const results = [];
      for (const userId of userIds) {
        try {
          let userUuid;
          if (!this.isValidUUID(userId)) {
            const {data: userData, error: userError} = await supabase
              .from('users_rogues_7a9k2m')
              .select('id')
              .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
              .maybeSingle();

            if (userError || !userData) {
              console.error(`User not found: ${userId}`);
              continue;
            }
            userUuid = userData.id;
          } else {
            userUuid = userId;
          }

          const {error} = await supabase
            .from('session_attendees_rogues_7a9k2m')
            .update({
              attended: attended,
              admin_processed: true,
              confirmed_by: confirmedByUuid,
              confirmed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('user_id', userUuid);

          if (error) {
            console.error(`Failed to update attendance for user ${userId}:`, error);
            continue;
          }

          // Update user's session count if they attended
          if (attended) {
            try {
              await supabase.rpc('increment_sessions_attended', {user_id: userUuid});
            } catch (rpcError) {
              console.error('Failed to update session count:', rpcError);
            }
          }

          results.push({userId, success: true});
        } catch (userError) {
          console.error(`Error processing user ${userId}:`, userError);
          results.push({userId, success: false, error: userError.message});
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to bulk confirm attendance:', error);
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
        const {data: userData, error: userError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', sessionData.creatorEmail || 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) {
          // If user not found, use a default admin user
          const {data: adminUser} = await supabase
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

      // Extract pace groups from session data
      const paceGroups = sessionData.paceGroups || [];

      // Handle numeric fields - convert empty strings to null
      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

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
        start_location_lat: cleanNumericField(sessionData.startLocationLat),
        start_location_lng: cleanNumericField(sessionData.startLocationLng),
        start_location_address: sessionData.startLocationAddress,
        route_type: sessionData.routeType,
        route_map: sessionData.routeMap,
        total_distance: cleanNumericField(sessionData.totalDistance),
        run_type: sessionData.runType,
        pace_min: cleanNumericField(sessionData.paceMin),
        pace_max: cleanNumericField(sessionData.paceMax),
        difficulty: sessionData.difficulty,
        waitlist_enabled: sessionData.waitlistEnabled,
        special_instructions: sessionData.specialInstructions,
        required_gear: requiredGear
      };

      const {data, error} = await supabase
        .from('sessions_rogues_7a9k2m')
        .insert([sessionInsertData])
        .select()
        .single();

      if (error) throw error;

      // Create pace groups for the session
      if (paceGroups && paceGroups.length > 0) {
        for (const group of paceGroups) {
          try {
            await paceGroupService.createPaceGroup({
              sessionId: data.id,
              name: group.name,
              minPace: cleanNumericField(group.minPace),
              maxPace: cleanNumericField(group.maxPace),
              description: group.description,
              requiredPacers: group.requiredPacers,
              shadowSlots: group.shadowSlots
            });
          } catch (groupError) {
            console.error('Failed to create pace group:', groupError);
            // Continue creating other groups even if one fails
          }
        }
      }

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
        const {data: userData, error: userError} = await supabase
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
      const {data: existing, error: checkError} = await supabase
        .from('session_attendees_rogues_7a9k2m')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userUuid);

      if (checkError) {
        console.error('Error checking attendance:', checkError);
      }

      if (existing && existing.length > 0) {
        // Leave session
        const {error} = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userUuid);

        if (error) throw error;
        toast.success('Left session successfully');
        return false; // Not joined
      } else {
        // Join session
        const {error} = await supabase
          .from('session_attendees_rogues_7a9k2m')
          .insert([{
            session_id: sessionId,
            user_id: userUuid,
            status: 'registered'
          }]);

        if (error) throw error;
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
        const {data: userData, error: userError} = await supabase
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
      const {data: existing, error: checkError} = await supabase
        .from('session_interested_users_rogues_7a9k2m')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userUuid);

      if (checkError) {
        console.error('Error checking interest:', checkError);
      }

      if (existing && existing.length > 0) {
        // Remove interest
        const {error} = await supabase
          .from('session_interested_users_rogues_7a9k2m')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userUuid);

        if (error) throw error;
        toast.success('Removed from interested list');
        return false; // Not interested
      } else {
        // Add interest
        const {error} = await supabase
          .from('session_interested_users_rogues_7a9k2m')
          .insert([{
            session_id: sessionId,
            user_id: userUuid
          }]);

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
        const {data: userData, error: userError} = await supabase
          .from('users_rogues_7a9k2m')
          .select('id')
          .eq('email', userId.includes('@') ? userId : 'admin@rogues.run')
          .maybeSingle();

        if (userError || !userData) return false;
        userUuid = userData.id;
      } else {
        userUuid = userId;
      }

      const {data, error} = await supabase
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

      // Handle numeric fields - convert empty strings to null
      const cleanNumericField = (value) => {
        if (value === '' || value === undefined || value === null) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      // Extract pace groups from updates
      const paceGroups = updates.paceGroups || [];

      const {error} = await supabase
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
          start_location_lat: cleanNumericField(updates.startLocationLat),
          start_location_lng: cleanNumericField(updates.startLocationLng),
          start_location_address: updates.startLocationAddress,
          route_type: updates.routeType,
          route_map: updates.routeMap,
          total_distance: cleanNumericField(updates.totalDistance),
          run_type: updates.runType,
          pace_min: cleanNumericField(updates.paceMin),
          pace_max: cleanNumericField(updates.paceMax),
          difficulty: updates.difficulty,
          waitlist_enabled: updates.waitlistEnabled,
          special_instructions: updates.specialInstructions,
          required_gear: requiredGear
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Update pace groups if provided
      if (paceGroups && paceGroups.length > 0) {
        // Get existing pace groups for this session
        const existingGroups = await paceGroupService.getPaceGroupsBySessionId(sessionId);
        
        // Delete existing groups
        for (const existingGroup of existingGroups) {
          try {
            await paceGroupService.deletePaceGroup(existingGroup.id);
          } catch (deleteError) {
            console.error('Failed to delete existing pace group:', deleteError);
          }
        }

        // Create new groups
        for (const group of paceGroups) {
          try {
            await paceGroupService.createPaceGroup({
              sessionId: sessionId,
              name: group.name,
              minPace: cleanNumericField(group.minPace),
              maxPace: cleanNumericField(group.maxPace),
              description: group.description,
              requiredPacers: group.requiredPacers,
              shadowSlots: group.shadowSlots
            });
          } catch (createError) {
            console.error('Failed to create pace group:', createError);
          }
        }
      }

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
      const {error} = await supabase
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
      const {data, error} = await supabase
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
      const {data: userData, error: userError} = await supabase
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
      const {data: sessions, error} = await supabase
        .from('sessions_rogues_7a9k2m')
        .select('*')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', {ascending: true});

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
      const {data, error} = await supabase
        .from('session_comments_rogues_7a9k2m')
        .select(`
          *,
          user:users_rogues_7a9k2m!user_id(name, email, picture)
        `)
        .eq('session_id', sessionId)
        .order('created_at', {ascending: false});

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
        const {data: userData, error: userError} = await supabase
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

      const {error} = await supabase
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