// User Statistics Configuration
// This file contains configuration for user statistics display
// Update these values to match your actual user counts

export const USER_STATS_CONFIG = {
  // Total registered users (from auth.users)
  TOTAL_USERS: 20,
  
  // Users with completed profiles (from profiles table)
  USERS_WITH_PROFILES: 11,
  
  // Active users (users who signed in last 30 days)
  ACTIVE_USERS: 6,
  
  // Recent signups (last 30 days)
  RECENT_SIGNUPS: 3,
  
  // Premium users (Professional + Elite)
  PREMIUM_USERS: 0,
  PROFESSIONAL_USERS: 0,
  ELITE_USERS: 0,
  
  // Newsletter subscribers
  NEWSLETTER_SUBSCRIBERS: 0,
  
  // Free users (Total - Premium)
  FREE_USERS: 20, // 20 - 0 = 20
  
  // Conversion rate
  CONVERSION_RATE: 0, // (Premium / Total) * 100
};

// Helper function to get user stats
export function getUserStats() {
  return {
    total_users: USER_STATS_CONFIG.TOTAL_USERS,
    active_users: USER_STATS_CONFIG.ACTIVE_USERS,
    premium_users: USER_STATS_CONFIG.PREMIUM_USERS,
    newsletter_subscribers: USER_STATS_CONFIG.NEWSLETTER_SUBSCRIBERS,
    recent_signups: USER_STATS_CONFIG.RECENT_SIGNUPS,
    free_users: USER_STATS_CONFIG.FREE_USERS,
    professional_users: USER_STATS_CONFIG.PROFESSIONAL_USERS,
    elite_users: USER_STATS_CONFIG.ELITE_USERS,
  };
}

// Helper function to update stats
export function updateUserStats(newStats: Partial<typeof USER_STATS_CONFIG>) {
  Object.assign(USER_STATS_CONFIG, newStats);
} 