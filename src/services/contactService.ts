
import { supabase } from '@/integrations/supabase/client';
import { ContactRecord } from '@/types/patient';

export class ContactService {
  static async loadContactRecords(organizationId: string): Promise<Record<string, ContactRecord[]>> {
    console.log('📥 ContactService.loadContactRecords:', organizationId);
    
    const { data, error } = await supabase
      .from('contact_records')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Error loading contact records:', error);
      throw error;
    }

    console.log('✅ Contact records loaded:', data?.length || 0);

    // Group contacts by patient
    const contactsByPatient: Record<string, ContactRecord[]> = {};
    data?.forEach(contact => {
      if (!contactsByPatient[contact.patient_id]) {
        contactsByPatient[contact.patient_id] = [];
      }
      contactsByPatient[contact.patient_id].push({
        id: contact.id,
        date: new Date(contact.date),
        method: contact.method as ContactRecord['method'],
        notes: contact.notes || '',
        successful: contact.successful
      });
    });

    return contactsByPatient;
  }

  static async addContactRecord(patientId: string, contactRecord: Omit<ContactRecord, 'id'>, userId: string, organizationId: string): Promise<void> {
    console.log('➕ ContactService.addContactRecord:', { patientId, userId, organizationId });
    
    const { error } = await supabase
      .from('contact_records')
      .insert([{
        patient_id: patientId,
        user_id: userId,
        organization_id: organizationId,
        date: contactRecord.date.toISOString(),
        method: contactRecord.method,
        notes: contactRecord.notes,
        successful: contactRecord.successful
      }])
      .select();

    if (error) {
      console.error('❌ Error adding contact record:', error);
      throw error;
    }

    console.log('✅ Contact record added');
  }
}
