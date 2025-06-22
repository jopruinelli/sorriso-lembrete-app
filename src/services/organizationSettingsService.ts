
import { supabase } from '@/integrations/supabase/client';
import { OrganizationSettings } from '@/types/organization';

export class OrganizationSettingsService {
  static async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    console.log('⚙️ OrganizationSettingsService.getOrganizationSettings:', organizationId);
    
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
    console.log('📝 OrganizationSettingsService.updateOrganizationSettings:', { organizationId, updates });
    
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

  static async createDefaultSettings(organizationId: string): Promise<void> {
    console.log('⚙️ OrganizationSettingsService.createDefaultSettings:', organizationId);
    
    const { error } = await supabase
      .from('organization_settings')
      .insert([{
        organization_id: organizationId,
        whatsapp_default_message: 'Olá {nome_do_paciente}! Este é um lembrete da sua consulta marcada para {data_proximo_contato}. Aguardamos você!'
      }])
      .select();

    if (error) {
      console.error('❌ Error creating organization settings:', error);
      throw error;
    }

    console.log('✅ Organization settings created');
  }
}
