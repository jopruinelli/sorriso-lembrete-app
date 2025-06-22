
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/organization';

export class UserApprovalService {
  static async getPendingUsers(organizationId: string): Promise<UserProfile[]> {
    console.log('👥 UserApprovalService.getPendingUsers:', organizationId);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending users:', error);
        throw error;
      }

      console.log('✅ Pending users loaded:', data);
      
      // Manually create UserProfile objects to avoid type instantiation issues
      const pendingUsers: UserProfile[] = [];
      if (data) {
        data.forEach(user => {
          pendingUsers.push({
            id: user.id,
            user_id: user.user_id,
            organization_id: user.organization_id,
            name: user.name,
            role: user.role as 'admin' | 'user',
            status: (user as any).status as 'pending' | 'approved' | 'rejected',
            created_at: user.created_at,
            updated_at: user.updated_at
          });
        });
      }
      
      return pendingUsers;
    } catch (error) {
      console.error('❌ Error in getPendingUsers:', error);
      throw error;
    }
  }

  static async approveUser(userId: string): Promise<void> {
    console.log('✅ UserApprovalService.approveUser:', userId);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'approved' } as any)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error approving user:', error);
        throw error;
      }

      console.log('✅ User approved successfully');
    } catch (error) {
      console.error('❌ Error in approveUser:', error);
      throw error;
    }
  }

  static async rejectUser(userId: string): Promise<void> {
    console.log('❌ UserApprovalService.rejectUser:', userId);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Error rejecting user:', error);
        throw error;
      }

      console.log('✅ User rejected successfully');
    } catch (error) {
      console.error('❌ Error in rejectUser:', error);
      throw error;
    }
  }
}
