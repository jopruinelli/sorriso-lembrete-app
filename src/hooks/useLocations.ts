import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  id: string;
  name: string;
  address?: string;
  is_active: boolean;
}

export const useLocations = (organizationId?: string) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      if (!organizationId) {
        setLocations([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, address, is_active')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        setLocations(data || []);
      } catch (error) {
        console.error('❌ Error loading locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [organizationId]);

  return { locations, loading };
};