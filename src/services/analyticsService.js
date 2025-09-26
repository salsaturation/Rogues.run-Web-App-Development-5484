import {supabase} from '../lib/supabase';

export const analyticsService = {
  // Track general event
  async trackEvent(eventType, userId = null, data = {}, sessionId = null) {
    try {
      // Handle user ID - convert to UUID if needed or use as-is for non-UUID strings
      let trackingUserId = userId;
      if (userId && typeof userId === 'string' && !this.isValidUUID(userId)) {
        // For non-UUID user IDs (like Facebook IDs), use them as-is
        // The analytics table should accept TEXT user IDs
        trackingUserId = userId;
      }

      const payload = {
        event_type: eventType,
        user_id: trackingUserId,
        session_id: sessionId,
        data: data || {}
      };

      // Add client information
      payload.data = {
        ...payload.data,
        client_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          timestamp: new Date().toISOString()
        }
      };

      const {error} = await supabase
        .from('analytics_rogues_7a9k2m')
        .insert([payload]);

      if (error) {
        console.error('Failed to track analytics event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Analytics tracking error:', error);
      return false;
    }
  },

  // Track page view
  async trackPageView(page, userId = null) {
    return this.trackEvent('page_view', userId, {page});
  },

  // Track session interaction
  async trackSessionInteraction(action, sessionId, userId = null, details = {}) {
    return this.trackEvent('session_interaction', userId, {action, ...details}, sessionId);
  },

  // Track user interaction
  async trackUserInteraction(action, userId = null, details = {}) {
    return this.trackEvent('user_interaction', userId, {action, ...details});
  },

  // Get analytics summary (for admin dashboard)
  async getAnalyticsSummary() {
    try {
      // Get total events count
      const {data: totalEvents, error: countError} = await supabase
        .from('analytics_rogues_7a9k2m')
        .select('id', {count: 'exact', head: true});

      // Get event types breakdown
      const {data: eventTypes, error: typesError} = await supabase
        .from('analytics_rogues_7a9k2m')
        .select('event_type')
        .order('created_at', {ascending: false})
        .limit(100);

      // Get recent user activity
      const {data: recentActivity, error: activityError} = await supabase
        .from('analytics_rogues_7a9k2m')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(20);

      if (countError || typesError || activityError) {
        console.error('Error fetching analytics summary:', {countError, typesError, activityError});
        return null;
      }

      // Process event types to get counts
      const eventTypeCounts = {};
      if (eventTypes) {
        eventTypes.forEach(event => {
          eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
        });
      }

      return {
        totalEvents: totalEvents?.length || 0,
        eventTypeCounts,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return null;
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

export default analyticsService;