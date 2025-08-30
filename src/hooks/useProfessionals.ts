import { useState, useEffect } from 'react';
import { Professional } from '@/types/professional';
import { ProfessionalService } from '@/services/professionalService';

export const useProfessionals = (organizationId?: string) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!organizationId) {
        setProfessionals([]);
        setLoading(false);
        return;
      }

      try {
        const data = await ProfessionalService.loadProfessionals(organizationId);
        setProfessionals(data);
      } catch (error) {
        console.error('❌ Error loading professionals:', error);
        setProfessionals([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId]);

  const addProfessional = async (professional: Omit<Professional, 'id'>) => {
    if (!organizationId) return;
    try {
      const newProfessional = await ProfessionalService.addProfessional(professional, organizationId);
      setProfessionals(prev => [...prev, newProfessional]);
    } catch (error) {
      console.error('❌ Error adding professional:', error);
    }
  };

  return { professionals, loading, addProfessional };
};
