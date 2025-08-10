import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';

export const usePatientAppointments = (patientId?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, location:locations(name, address)')
          .eq('patient_id', patientId)
          .order('start_time', { ascending: false });
        if (error) throw error;
        setAppointments((data || []) as Appointment[]);
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [patientId]);

  return { appointments, loading };
};
