
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';
import { OrganizationSettingsService } from './organizationSettingsService';

export class OrganizationService {
  static async createOrganization(name: string, userId: string, userName: string, isMainAdmin: boolean = false): Promise<Organization> {
    console.log('🏢 OrganizationService.createOrganization:', { name, userId, userName, isMainAdmin });
    
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
          role: 'admin',
          status: 'approved' // Auto-aprovado para quem cria a organização
        }])
        .select();

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as admin');

      // Create default organization settings
      await OrganizationSettingsService.createDefaultSettings(orgData.id);

      return orgData;
    } catch (error) {
      console.error('❌ OrganizationService.createOrganization failed:', error);
      throw error;
    }
  }

  static async joinOrganization(organizationName: string, userId: string, userName: string): Promise<Organization> {
    console.log('🤝 OrganizationService.joinOrganization:', { organizationName, userId, userName });
    
    try {
      // Find organization by name
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

      // Create user profile with pending status
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          organization_id: orgData.id,
          name: userName,
          role: 'user',
          status: 'pending' // Aguardando aprovação
        }])
        .select();

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as pending user');
      return orgData;
    } catch (error) {
      console.error('❌ OrganizationService.joinOrganization failed:', error);
      throw error;
    }
  }
}
