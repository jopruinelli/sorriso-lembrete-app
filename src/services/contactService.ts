
import { supabase } from '@/integrations/supabase/client';
import { ContactRecord } from '@/types/patient';

export class ContactService {
  static async loadContactRecords(organizationId: string) {
    const { data: contactsData, error } = await supabase
      .from('contact_records')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) throw error;

    // Group contacts by patient
    const contactsByPatient: Record<string, ContactRecord[]> = {};
    contactsData?.forEach(contact => {
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

  static async addContactRecord(patientId: string, contactRecord: Omit<ContactRecord, 'id'>, userId: string, organizationId: string) {
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
      }]);

    if (error) throw error;
  }
}
