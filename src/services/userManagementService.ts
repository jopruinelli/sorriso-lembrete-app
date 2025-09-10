
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Organization } from '@/types/organization';

export class UserManagementService {
  static async getOrganizationUsers(organizationId: string): Promise<UserProfile[]> {
    console.log('👥 UserManagementService.getOrganizationUsers:', organizationId);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching organization users:', error);
        throw error;
      }

      console.log('✅ Raw organization users data:', data);
      
      // Verificar se temos dados
      if (!data || data.length === 0) {
        console.log('⚠️ No users found for organization:', organizationId);
        return [];
      }

      interface RawUser {
        id: string;
        user_id: string;
        organization_id: string;
        name: string;
        role: string;
        status: string;
        created_at: string;
        updated_at: string;
        organizations: Organization;
        auth_users?: { email?: string };
      }

      // Mapear os dados para UserProfile
      const users: UserProfile[] = (data as RawUser[]).map(user => ({
        id: user.id,
        user_id: user.user_id,
        organization_id: user.organization_id,
        name: user.name,
        email: user.auth_users?.email || undefined,
        role: user.role as 'admin' | 'user',
        status: user.status as 'pending' | 'approved' | 'rejected',
        created_at: user.created_at,
        updated_at: user.updated_at,
        organizations: user.organizations
      }));

      console.log('✅ Mapped organization users:', users);
      
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
      // Get current user and organization info for security validation
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario não autenticado');
      }

      // Verify current user is admin in the same organization as target user
      const { data: targetUser, error: targetError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (targetError || !targetUser) {
        throw new Error('Usuário alvo não encontrado');
      }

      const { data: currentUserProfile, error: currentError } = await supabase
        .from('user_profiles')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single();

      if (currentError || !currentUserProfile) {
        throw new Error('Perfil do usuário atual não encontrado');
      }

      // Security checks
      if (currentUserProfile.role !== 'admin') {
        throw new Error('Apenas administradores podem alterar funções');
      }

      if (currentUserProfile.organization_id !== targetUser.organization_id) {
        throw new Error('Usuários só podem gerenciar membros da mesma organização');
      }

      if (user.id === userId) {
        throw new Error('Usuários não podem alterar sua própria função');
      }

      // Update the role
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user role:', error);
        throw error;
      }

      // Log security event
      await this.logSecurityEvent(user.id, currentUserProfile.organization_id, 'role_change', {
        target_user_id: userId,
        new_role: role,
        timestamp: new Date().toISOString()
      });

      console.log('✅ User role updated successfully');
    } catch (error) {
      console.error('❌ Error in updateUserRole:', error);
      throw error;
    }
  }

  static async logSecurityEvent(
    userId: string, 
    organizationId: string, 
    eventType: string, 
      eventData: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          event_type: eventType,
          event_data: eventData as any,
        } as any);
    } catch (error) {
      // Log errors but don't fail the main operation
      console.error('Failed to log security event:', error);
    }
  }
}
