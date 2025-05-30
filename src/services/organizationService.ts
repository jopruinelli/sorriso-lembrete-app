
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserProfile, OrganizationSettings } from '@/types/organization';

export class OrganizationService {
  private static REQUEST_TIMEOUT = 10000; // 10 segundos

  private static withTimeout<T>(promise: Promise<T>, timeoutMs = this.REQUEST_TIMEOUT): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  }

  static async createOrganization(name: string, userId: string, userName: string) {
    console.log('🏢 OrganizationService.createOrganization:', { name, userId, userName });
    
    try {
      // Create organization
      const { data: orgData, error: orgError } = await this.withTimeout(
        supabase
          .from('organizations')
          .insert([{ name }])
          .select()
          .single()
      );

      if (orgError) {
        console.error('❌ Error creating organization:', orgError);
        throw orgError;
      }

      console.log('✅ Organization created:', orgData);

      // Create user profile as admin
      const { error: profileError } = await this.withTimeout(
        supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            organization_id: orgData.id,
            name: userName,
            role: 'admin'
          }])
      );

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as admin');

      // Create default organization settings
      const { error: settingsError } = await this.withTimeout(
        supabase
          .from('organization_settings')
          .insert([{
            organization_id: orgData.id,
            whatsapp_default_message: 'Olá {nome_do_paciente}! Este é um lembrete da sua consulta marcada para {data_proximo_contato}. Aguardamos você!'
          }])
      );

      if (settingsError) {
        console.error('❌ Error creating organization settings:', settingsError);
        throw settingsError;
      }

      console.log('✅ Organization settings created');
      return orgData;
    } catch (error) {
      console.error('❌ OrganizationService.createOrganization failed:', error);
      throw error;
    }
  }

  static async joinOrganization(organizationName: string, userId: string, userName: string) {
    console.log('🤝 OrganizationService.joinOrganization:', { organizationName, userId, userName });
    
    try {
      // Find organization by name
      const { data: orgData, error: orgError } = await this.withTimeout(
        supabase
          .from('organizations')
          .select('*')
          .eq('name', organizationName)
          .single()
      );

      if (orgError) {
        console.error('❌ Organization not found:', orgError);
        throw new Error('Organização não encontrada');
      }

      console.log('✅ Organization found:', orgData);

      // Create user profile
      const { error: profileError } = await this.withTimeout(
        supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            organization_id: orgData.id,
            name: userName,
            role: 'user'
          }])
      );

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as user');
      return orgData;
    } catch (error) {
      console.error('❌ OrganizationService.joinOrganization failed:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('👤 OrganizationService.getUserProfile:', userId);
    
    try {
      // Use a direct query with explicit timeout
      const { data: profileData, error: profileError } = await this.withTimeout(
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        8000 // Timeout menor para profile
      );

      // Se há erro, log e retorne null graciosamente
      if (profileError) {
        console.warn('⚠️ Error fetching user profile (returning null):', profileError);
        
        // Se é erro de RLS/policy, falhar silenciosamente
        const errorMessage = profileError.message?.toLowerCase() || '';
        if (errorMessage.includes('infinite recursion') || 
            errorMessage.includes('policy') ||
            errorMessage.includes('row-level security')) {
          console.log('🔧 RLS error detected, returning null gracefully');
          return null;
        }
        
        // Para outros erros, ainda retorna null mas loga
        console.warn('⚠️ Non-RLS error, returning null:', profileError);
        return null;
      }

      // If no profile exists, return null (this is normal for new users)
      if (!profileData) {
        console.log('ℹ️ No user profile found for user:', userId);
        return null;
      }

      console.log('✅ User profile found:', profileData);

      // Separately fetch organization data with timeout
      const { data: orgData, error: orgError } = await this.withTimeout(
        supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .maybeSingle(),
        5000 // Timeout menor para org
      );

      // If organization doesn't exist, still return the profile without org data
      if (orgError || !orgData) {
        console.log('⚠️ No organization found for profile (continuing without org data):', profileData.organization_id);
        return {
          ...profileData,
          role: profileData.role as 'admin' | 'user',
          organizations: undefined
        } as UserProfile;
      }

      console.log('✅ Organization data loaded:', orgData);

      // Combine the data manually
      return {
        ...profileData,
        role: profileData.role as 'admin' | 'user',
        organizations: orgData
      } as UserProfile;
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      
      // Para erros de timeout ou conexão, retornar null graciosamente
      if (error?.message?.includes('timeout') || error?.message?.includes('fetch')) {
        console.log('🔧 Network/timeout error, returning null gracefully');
        return null;
      }
      
      // Para outros erros, still return null but re-throw if needed
      console.warn('⚠️ Unexpected error in getUserProfile, returning null:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'name'>>) {
    console.log('📝 OrganizationService.updateUserProfile:', { userId, updates });
    
    const { error } = await this.withTimeout(
      supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
    );

    if (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
    
    console.log('✅ User profile updated');
  }

  static async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    console.log('⚙️ OrganizationService.getOrganizationSettings:', organizationId);
    
    try {
      const { data, error } = await this.withTimeout(
        supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle()
      );

      if (error) {
        console.log('⚠️ Error fetching organization settings:', error);
        return null;
      }
      
      console.log('✅ Organization settings loaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in getOrganizationSettings:', error);
      return null;
    }
  }

  static async updateOrganizationSettings(organizationId: string, updates: Partial<Pick<OrganizationSettings, 'whatsapp_default_message'>>) {
    console.log('📝 OrganizationService.updateOrganizationSettings:', { organizationId, updates });
    
    const { error } = await this.withTimeout(
      supabase
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('❌ Error updating organization settings:', error);
      throw error;
    }
    
    console.log('✅ Organization settings updated');
  }

  static async deleteUserAccount(userId: string) {
    console.log('🗑️ OrganizationService.deleteUserAccount:', userId);
    
    const { error } = await this.withTimeout(
      supabase.auth.admin.deleteUser(userId)
    );
    
    if (error) {
      console.error('❌ Error deleting user account:', error);
      throw error;
    }
    
    console.log('✅ User account deleted');
  }
}
