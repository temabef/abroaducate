// =====================================================
// AUTH REDIRECT SERVICE
// Handles post-authentication routing logic
// =====================================================

import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { loadUnifiedProfile } from './unifiedProfile.js';

/**
 * Determine where to redirect user after successful authentication
 */
export async function getPostAuthRedirect(
  supabase: SupabaseClient,
  session: Session | null,
  returnUrl?: string
): Promise<string> {
  // Default fallback - always go to dashboard after login
  const defaultReturn = returnUrl || '/dashboard';
  
  if (!session?.user?.id || !supabase) {
    return defaultReturn;
  }
  
  // Always redirect to intended destination (usually dashboard)
  // ProfileCompletionWidget will guide users to complete their profile
  return defaultReturn;
}

/**
 * Perform the redirect with proper navigation
 */
export function performRedirect(url: string): void {
  if (browser) {
    // Use window.location.href for immediate redirect
    // This ensures auth state is properly updated before navigation
    window.location.href = url;
  }
}

/**
 * Check if current user needs onboarding
 * Useful for protecting routes
 */
export async function userNeedsOnboarding(
  supabase: SupabaseClient,
  session: Session | null
): Promise<boolean> {
  if (!session?.user?.id) return false;
  
  try {
    const { profile } = await loadUnifiedProfile(supabase, session);
    return !profile || !profile.onboarding_completed;
  } catch {
    return false;
  }
}

/**
 * Middleware for route protection
 * Returns redirect URL if user needs onboarding, null if they can proceed
 */
export async function checkOnboardingRequired(
  supabase: SupabaseClient,
  session: Session | null,
  currentPath: string,
  exemptPaths: string[] = ['/onboarding', '/auth', '/api']
): Promise<string | null> {
  // Skip check for exempt paths
  if (exemptPaths.some(path => currentPath.startsWith(path))) {
    return null;
  }
  
  const needsOnboarding = await userNeedsOnboarding(supabase, session);
  return needsOnboarding ? '/onboarding' : null;
}

