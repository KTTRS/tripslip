import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hook to track teacher login timestamps
 * Updates last_login_at in teachers table when user logs in
 */
export function useLoginTracker(
  user: User | null,
  supabase: SupabaseClient
): void {
  useEffect(() => {
    if (!user) return;

    const updateLastLogin = async () => {
      try {
        // Check if user has a teacher profile
        const { data: teacher, error: fetchError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !teacher) {
          // User is not a teacher, skip tracking
          return;
        }

        // Update last_login_at timestamp
        const { error: updateError } = await supabase
          .from('teachers')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', teacher.id);

        if (updateError) {
          console.error('Failed to update last login:', updateError);
        }
      } catch (error) {
        console.error('Error tracking login:', error);
      }
    };

    // Update on mount (when user is authenticated)
    updateLastLogin();
  }, [user, supabase]);
}

/**
 * Format last login timestamp for display
 * @param lastLogin - ISO timestamp or null
 * @param t - Translation function
 * @returns Formatted string
 */
export function formatLastLogin(
  lastLogin: string | null,
  t: (key: string, fallback: string) => string
): string {
  if (!lastLogin) {
    return t('auth.neverLoggedIn', 'Never logged in');
  }

  const date = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return t('auth.justNow', 'Just now');
  } else if (diffMins < 60) {
    return t('auth.minutesAgo', `${diffMins} minutes ago`);
  } else if (diffHours < 24) {
    return t('auth.hoursAgo', `${diffHours} hours ago`);
  } else if (diffDays < 7) {
    return t('auth.daysAgo', `${diffDays} days ago`);
  } else {
    return date.toLocaleDateString();
  }
}
