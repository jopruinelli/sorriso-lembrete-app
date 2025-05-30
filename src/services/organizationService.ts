
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserProfile, OrganizationSettings } from '@/types/organization';
import type { PostgrestResponse } from '@supabase/supabase-js';

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
      const orgResult = await this.withTimeout(
        supabase
          .from('organizations')
          .insert([{ name }])
          .select()
          .single()
      ) as PostgrestResponse<Organization>;

      if (orgResult.error) {
        console.error('❌ Error creating organization:', orgResult.error);
        throw orgResult.error;
      }

      console.log('✅ Organization created:', orgResult.data);

      // Create user profile as admin
      const profileResult = await this.withTimeout(
        supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            organization_id: orgResult.data.id,
            name: userName,
            role: 'admin'
          }])
      ) as PostgrestResponse<any>;

      if (profileResult.error) {
        console.error('❌ Error creating user profile:', profileResult.error);
        throw profileResult.error;
      }

      console.log('✅ User profile created as admin');

      // Create default organization settings
      const settingsResult = await this.withTimeout(
        supabase
          .from('organization_settings')
          .insert([{
            organization_id: orgResult.data.id,
            whatsapp_default_message: 'Olá {nome_do_paciente}! Este é um lembrete da sua consulta marcada para {data_proximo_contato}. Aguardamos você!'
          }])
      ) as PostgrestResponse<any>;

      if (settingsResult.error) {
        console.error('❌ Error creating organization settings:', settingsResult.error);
        throw settingsResult.error;
      }

      console.log('✅ Organization settings created');
      return orgResult.data;
    } catch (error) {
      console.error('❌ OrganizationService.createOrganization failed:', error);
      throw error;
    }
  }

  static async joinOrganization(organizationName: string, userId: string, userName: string) {
    console.log('🤝 OrganizationService.joinOrganization:', { organizationName, userId, userName });
    
    try {
      // Find organization by name
      const orgResult = await this.withTimeout(
        supabase
          .from('organizations')
          .select('*')
          .eq('name', organizationName)
          .single()
      ) as PostgrestResponse<Organization>;

      if (orgResult.error) {
        console.error('❌ Organization not found:', orgResult.error);
        throw new Error('Organização não encontrada');
      }

      console.log('✅ Organization found:', orgResult.data);

      // Create user profile
      const profileResult = await this.withTimeout(
        supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            organization_id: orgResult.data.id,
            name: userName,
            role: 'user'
          }])
      ) as PostgrestResponse<any>;

      if (profileResult.error) {
        console.error('❌ Error creating user profile:', profileResult.error);
        throw profileResult.error;
      }

      console.log('✅ User profile created as user');
      return orgResult.data;
    } catch (error) {
      console.error('❌ OrganizationService.joinOrganization failed:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('👤 OrganizationService.getUserProfile:', userId);
    
    try {
      // Use a direct query with explicit timeout
      const profileResult = await this.withTimeout(
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        8000 // Timeout menor para profile
      ) as PostgrestResponse<UserProfile>;

      // Se há erro, log e retorne null graciosamente
      if (profileResult.error) {
        console.warn('⚠️ Error fetching user profile (returning null):', profileResult.error);
        
        // Se é erro de RLS/policy, falhar silenciosamente
        const errorMessage = profileResult.error.message?.toLowerCase() || '';
        if (errorMessage.includes('infinite recursion') || 
            errorMessage.includes('policy') ||
            errorMessage.includes('row-level security')) {
          console.log('🔧 RLS error detected, returning null gracefully');
          return null;
        }
        
        // Para outros erros, ainda retorna null mas loga
        console.warn('⚠️ Non-RLS error, returning null:', profileResult.error);
        return null;
      }

      // If no profile exists, return null (this is normal for new users)
      if (!profileResult.data) {
        console.log('ℹ️ No user profile found for user:', userId);
        return null;
      }

      console.log('✅ User profile found:', profileResult.data);

      // Separately fetch organization data with timeout
      const orgResult = await this.withTimeout(
        supabase
          .from('organizations')
          .select('*')
          .eq('id', profileResult.data.organization_id)
          .maybeSingle(),
        5000 // Timeout menor para org
      ) as PostgrestResponse<Organization>;

      // If organization doesn't exist, still return the profile without org data
      if (orgResult.error || !orgResult.data) {
        console.log('⚠️ No organization found for profile (continuing without org data):', profileResult.data.organization_id);
        return {
          ...profileResult.data,
          role: profileResult.data.role as 'admin' | 'user',
          organizations: undefined
        } as UserProfile;
      }

      console.log('✅ Organization data loaded:', orgResult.data);

      // Combine the data manually
      return {
        ...profileResult.data,
        role: profileResult.data.role as 'admin' | 'user',
        organizations: orgResult.data
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
    
    const result = await this.withTimeout(
      supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
    ) as PostgrestResponse<any>;

    if (result.error) {
      console.error('❌ Error updating user profile:', result.error);
      throw result.error;
    }
    
    console.log('✅ User profile updated');
  }

  static async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    console.log('⚙️ OrganizationService.getOrganizationSettings:', organizationId);
    
    try {
      const result = await this.withTimeout(
        supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle()
      ) as PostgrestResponse<OrganizationSettings>;

      if (result.error) {
        console.log('⚠️ Error fetching organization settings:', result.error);
        return null;
      }
      
      console.log('✅ Organization settings loaded:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error in getOrganizationSettings:', error);
      return null;
    }
  }

  static async updateOrganizationSettings(organizationId: string, updates: Partial<Pick<OrganizationSettings, 'whatsapp_default_message'>>) {
    console.log('📝 OrganizationService.updateOrganizationSettings:', { organizationId, updates });
    
    const result = await this.withTimeout(
      supabase
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId)
    ) as PostgrestResponse<any>;

    if (result.error) {
      console.error('❌ Error updating organization settings:', result.error);
      throw result.error;
    }
    
    console.log('✅ Organization settings updated');
  }

  static async deleteUserAccount(userId: string) {
    console.log('🗑️ OrganizationService.deleteUserAccount:', userId);
    
    const result = await this.withTimeout(
      supabase.auth.admin.deleteUser(userId)
    );
    
    if (result.error) {
      console.error('❌ Error deleting user account:', result.error);
      throw result.error;
    }
    
    console.log('✅ User account deleted');
  }
}
