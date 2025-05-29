
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserProfile, OrganizationSettings } from '@/types/organization';

export class OrganizationService {
  static async createOrganization(name: string, userId: string, userName: string) {
    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name }])
      .select()
      .single();

    if (orgError) throw orgError;

    // Create user profile as admin
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: userId,
        organization_id: orgData.id,
        name: userName,
        role: 'admin'
      }]);

    if (profileError) throw profileError;

    // Create default organization settings
    const { error: settingsError } = await supabase
      .from('organization_settings')
      .insert([{
        organization_id: orgData.id,
        whatsapp_default_message: 'Olá {nome_do_paciente}! Este é um lembrete da sua consulta marcada para {data_proximo_contato}. Aguardamos você!'
      }]);

    if (settingsError) throw settingsError;

    return orgData;
  }

  static async joinOrganization(organizationName: string, userId: string, userName: string) {
    // Find organization by name
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', organizationName)
      .single();

    if (orgError) throw new Error('Organização não encontrada');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: userId,
        organization_id: orgData.id,
        name: userName,
        role: 'user'
      }]);

    if (profileError) throw profileError;

    return orgData;
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        organizations (*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    
    // Type assertion to ensure role is typed correctly
    return {
      ...data,
      role: data.role as 'admin' | 'user'
    } as UserProfile;
  }

  static async updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'name'>>) {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    const { data, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) return null;
    return data;
  }

  static async updateOrganizationSettings(organizationId: string, updates: Partial<Pick<OrganizationSettings, 'whatsapp_default_message'>>) {
    const { error } = await supabase
      .from('organization_settings')
      .update(updates)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  static async deleteUserAccount(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }
}
