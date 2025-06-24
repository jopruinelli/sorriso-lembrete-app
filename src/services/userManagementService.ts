
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/organization';

export class UserManagementService {
  static async getOrganizationUsers(organizationId: string): Promise<UserProfile[]> {
    console.log('👥 UserManagementService.getOrganizationUsers:', organizationId);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching organization users:', error);
        throw error;
      }

      console.log('✅ Organization users loaded:', data);
      
      // Manually create UserProfile objects
      const users: UserProfile[] = [];
      if (data) {
        data.forEach(user => {
          users.push({
            id: user.id,
            user_id: user.user_id,
            organization_id: user.organization_id,
            name: user.name,
            role: user.role as 'admin' | 'user',
            status: user.status as 'pending' | 'approved' | 'rejected' || 'approved',
            created_at: user.created_at,
            updated_at: user.updated_at,
            organizations: user.organizations
          });
        });
      }
      
      return users;
    } catch (error) {
      console.error('❌ Error in getOrganizationUsers:', error);
      throw error;
    }
  }

  static async approveUser(userId: string): Promise<void> {
    console.log('✅ UserManagementService.approveUser:', userId);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'approved' })
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
    console.log('❌ UserManagementService.rejectUser:', userId);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'rejected' })
        .eq('user_id', userId);

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

  static async removeUser(userId: string): Promise<void> {
    console.log('🗑️ UserManagementService.removeUser:', userId);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error removing user:', error);
        throw error;
      }

      console.log('✅ User removed successfully');
    } catch (error) {
      console.error('❌ Error in removeUser:', error);
      throw error;
    }
  }

  static async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    console.log('🔄 UserManagementService.updateUserRole:', { userId, role });
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating user role:', error);
        throw error;
      }

      console.log('✅ User role updated successfully');
    } catch (error) {
      console.error('❌ Error in updateUserRole:', error);
      throw error;
    }
  }
}
