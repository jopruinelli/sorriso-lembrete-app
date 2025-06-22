
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/organization';

export class UserProfileService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('👤 UserProfileService.getUserProfile:', userId);
    
    try {
      // Get user profile with organization data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('⚠️ Error fetching user profile:', profileError);
        return null;
      }

      if (!profileData) {
        console.log('ℹ️ No user profile found for user:', userId);
        return null;
      }

      console.log('✅ User profile found:', profileData);
      return {
        ...profileData,
        role: profileData.role as 'admin' | 'user',
        status: (profileData as any).status as 'pending' | 'approved' | 'rejected'
      };
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'name'>>): Promise<void> {
    console.log('📝 UserProfileService.updateUserProfile:', { userId, updates });
    
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
    
    console.log('✅ User profile updated');
  }

  static async deleteUserAccount(userId: string): Promise<void> {
    console.log('🗑️ UserProfileService.deleteUserAccount:', userId);
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('❌ Error deleting user account:', error);
      throw error;
    }
    
    console.log('✅ User account deleted');
  }
}
