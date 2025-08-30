import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfessionalRole {
  id: string;
  role: string;
  specialty: string | null;
  is_active: boolean;
}

export const useProfessionalRoles = (organizationId?: string) => {
  const [roles, setRoles] = useState<string[]>([]);
  const [specialtiesByRole, setSpecialtiesByRole] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      if (!organizationId) {
        setRoles([]);
        setSpecialtiesByRole({});
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('professional_roles')
          .select('id, role, specialty, is_active')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('role', { ascending: true });

        if (error) throw error;

        const roleSet = new Set<string>();
        const specialtyMap: Record<string, string[]> = {};

        data?.forEach(item => {
          roleSet.add(item.role);
          if (item.specialty) {
            if (!specialtyMap[item.role]) {
              specialtyMap[item.role] = [];
            }
            specialtyMap[item.role].push(item.specialty);
          }
        });

        setRoles(Array.from(roleSet));
        setSpecialtiesByRole(specialtyMap);
      } catch (error) {
        console.error('❌ Error loading professional roles:', error);
        setRoles([]);
        setSpecialtiesByRole({});
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [organizationId]);

  return { roles, specialtiesByRole, loading };
};

