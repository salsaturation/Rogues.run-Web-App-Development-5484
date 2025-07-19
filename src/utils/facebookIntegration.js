// Facebook SDK integration utilities
export const initializeFacebookSDK = () => {
  return new Promise((resolve) => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: 'your-facebook-app-id',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve();
    };

    // Load SDK script
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });
};

// Custom Facebook Login implementation for React 18 compatibility
export const initiateFacebookLogin = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.login((response) => {
        if (response.authResponse) {
          // Get user info
          window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
            resolve({
              ...userInfo,
              accessToken: response.authResponse.accessToken
            });
          });
        } else {
          reject(new Error('Facebook login failed'));
        }
      }, { scope: 'email' });
    } else {
      // Demo implementation for development
      resolve({
        id: 'facebook_demo_user',
        name: 'Facebook Demo User',
        email: 'demo@facebook.com',
        picture: {
          data: {
            url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          }
        },
        accessToken: 'demo_access_token'
      });
    }
  });
};

export const getGroupEvents = async (groupId) => {
  try {
    // In a real implementation, this would use Facebook Graph API
    // to fetch events from the connected Facebook group
    
    // Demo data
    const demoEvents = [
      {
        id: 'fb_event_1',
        name: 'Morning Run - Central Park',
        description: 'Easy paced morning run through the park',
        start_time: '2024-01-20T07:00:00',
        place: {
          name: 'Central Park',
          location: {
            city: 'New York',
            state: 'NY'
          }
        }
      },
      {
        id: 'fb_event_2',
        name: 'Hill Training Session',
        description: 'Intense hill training for building strength',
        start_time: '2024-01-22T18:30:00',
        place: {
          name: 'Hill Park',
          location: {
            city: 'New York',
            state: 'NY'
          }
        }
      }
    ];
    
    return demoEvents;
  } catch (error) {
    console.error('Error fetching Facebook group events:', error);
    return [];
  }
};

export const syncGroupMembers = async (groupId) => {
  try {
    // In a real implementation, this would fetch group members
    // and sync them with the app database
    
    console.log('Syncing Facebook group members...');
    
    // Demo implementation
    const demoMembers = [
      {
        id: 'fb_user_1',
        name: 'John Smith',
        email: 'john@example.com',
        picture: {
          data: {
            url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          }
        }
      },
      {
        id: 'fb_user_2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        picture: {
          data: {
            url: 'https://images.unsplash.com/photo-1494790108755-2616b9512fa6?w=100&h=100&fit=crop&crop=face'
          }
        }
      }
    ];
    
    return demoMembers;
  } catch (error) {
    console.error('Error syncing Facebook group members:', error);
    return [];
  }
};

export const postToGroup = async (groupId, message) => {
  try {
    // In a real implementation, this would post to the Facebook group
    console.log('Posting to Facebook group:', { groupId, message });
    
    // Demo implementation
    return {
      success: true,
      postId: 'demo_post_' + Date.now()
    };
  } catch (error) {
    console.error('Error posting to Facebook group:', error);
    return { success: false, error: error.message };
  }
};