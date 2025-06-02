
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserProfile, OrganizationSettings } from '@/types/organization';

export class OrganizationService {
  static async createOrganization(name: string, userId: string, userName: string): Promise<Organization> {
    console.log('🏢 OrganizationService.createOrganization:', { name, userId, userName });
    
    try {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name }])
        .select()
        .single();

      if (orgError) {
        console.error('❌ Error creating organization:', orgError);
        throw orgError;
      }

      console.log('✅ Organization created:', orgData);

      // Create user profile as admin
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          organization_id: orgData.id,
          name: userName,
          role: 'admin'
        }])
        .select();

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as admin');

      // Create default organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert([{
          organization_id: orgData.id,
          whatsapp_default_message: 'Olá {nome_do_paciente}! Este é um lembrete da sua consulta marcada para {data_proximo_contato}. Aguardamos você!'
        }])
        .select();

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

  static async joinOrganization(organizationName: string, userId: string, userName: string): Promise<Organization> {
    console.log('🤝 OrganizationService.joinOrganization:', { organizationName, userId, userName });
    
    try {
      // Find organization by name (use .maybeSingle() to avoid errors)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', organizationName)
        .maybeSingle();

      if (orgError || !orgData) {
        console.error('❌ Organization not found:', orgError);
        throw new Error('Organização não encontrada');
      }

      console.log('✅ Organization found:', orgData);

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          organization_id: orgData.id,
          name: userName,
          role: 'user'
        }])
        .select();

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
        role: profileData.role as 'admin' | 'user'
      };
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'name'>>): Promise<void> {
    console.log('📝 OrganizationService.updateUserProfile:', { userId, updates });
    
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

  static async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    console.log('⚙️ OrganizationService.getOrganizationSettings:', organizationId);
    
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

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

  static async updateOrganizationSettings(organizationId: string, updates: Partial<Pick<OrganizationSettings, 'whatsapp_default_message'>>): Promise<void> {
    console.log('📝 OrganizationService.updateOrganizationSettings:', { organizationId, updates });
    
    const { error } = await supabase
      .from('organization_settings')
      .update(updates)
      .eq('organization_id', organizationId)
      .select();

    if (error) {
      console.error('❌ Error updating organization settings:', error);
      throw error;
    }
    
    console.log('✅ Organization settings updated');
  }

  static async deleteUserAccount(userId: string): Promise<void> {
    console.log('🗑️ OrganizationService.deleteUserAccount:', userId);
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('❌ Error deleting user account:', error);
      throw error;
    }
    
    console.log('✅ User account deleted');
  }
}
