import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Location, AppointmentFormData } from '@/types/appointment';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useOrganization(user);

  const fetchAppointments = async () => {
    if (!userProfile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(name, phone),
          location:locations(name, address)
        `)
        .eq('organization_id', userProfile.organization_id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    }
  };

  const fetchLocations = async () => {
    if (!userProfile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os locais.",
        variant: "destructive",
      });
    }
  };

  const createAppointment = async (appointmentData: AppointmentFormData) => {
    if (!user?.id || !userProfile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          organization_id: userProfile.organization_id,
          user_id: user.id,
          start_time: appointmentData.start_time.toISOString(),
          end_time: appointmentData.end_time.toISOString(),
          recurrence_end_date: appointmentData.recurrence_end_date?.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAppointments();
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso.",
      });

      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const updateAppointment = async (id: string, appointmentData: AppointmentFormData) => {
    try {
      const updateData: any = { ...appointmentData };
      if (appointmentData.start_time) {
        updateData.start_time = appointmentData.start_time.toISOString();
      }
      if (appointmentData.end_time) {
        updateData.end_time = appointmentData.end_time.toISOString();
      }
      if (appointmentData.recurrence_end_date) {
        updateData.recurrence_end_date = appointmentData.recurrence_end_date.toISOString();
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchAppointments();
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAppointments();
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  const checkForConflicts = (startTime: Date, endTime: Date, excludeId?: string) => {
    return appointments.filter(appointment => {
      if (excludeId && appointment.id === excludeId) return false;
      
      const appointmentStart = new Date(appointment.start_time);
      const appointmentEnd = new Date(appointment.end_time);
      
      return (
        (startTime >= appointmentStart && startTime < appointmentEnd) ||
        (endTime > appointmentStart && endTime <= appointmentEnd) ||
        (startTime <= appointmentStart && endTime >= appointmentEnd)
      );
    });
  };

  useEffect(() => {
    if (userProfile?.organization_id) {
      setLoading(true);
      Promise.all([fetchAppointments(), fetchLocations()]).finally(() => {
        setLoading(false);
      });
    }
  }, [userProfile?.organization_id]);

  return {
    appointments,
    locations,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkForConflicts,
    fetchAppointments,
    fetchLocations,
  };
};