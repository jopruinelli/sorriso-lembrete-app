import { supabase } from '@/integrations/supabase/client';
import { Professional } from '@/types/professional';
import {
  convertToDbProfessional,
  convertToAppProfessional,
  assertDatabaseProfessional
} from '@/utils/professionalConverters';

export class ProfessionalService {
  static async loadProfessionals(organizationId: string): Promise<Professional[]> {
    if (!organizationId) {
      return [];
    }

    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error loading professionals:', error);
      throw error;
    }

    return (data || []).map(p => convertToAppProfessional(assertDatabaseProfessional(p)));
  }

  static async addProfessional(
    professionalData: Omit<Professional, 'id'>,
    organizationId: string
  ): Promise<Professional> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const dbProfessional = convertToDbProfessional(professionalData, organizationId);

    const { data, error } = await supabase
      .from('professionals')
      .insert(dbProfessional as any)
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding professional:', error);
      throw error;
    }

    return convertToAppProfessional(assertDatabaseProfessional(data));
  }
}
