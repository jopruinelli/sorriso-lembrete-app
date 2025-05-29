
import { useState, useEffect } from 'react';
import { UserProfile, OrganizationSettings } from '@/types/organization';
import { OrganizationService } from '@/services/organizationService';
import { useToast } from '@/hooks/use-toast';

export const useOrganization = (userId: string | undefined) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUserProfile = async () => {
    if (!userId) {
      setUserProfile(null);
      setOrganizationSettings(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await OrganizationService.getUserProfile(userId);
      setUserProfile(profile);

      if (profile?.organization_id) {
        const settings = await OrganizationService.getOrganizationSettings(profile.organization_id);
        setOrganizationSettings(settings);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Não mostrar toast de erro aqui, pois é normal não ter perfil na primeira vez
      setUserProfile(null);
      setOrganizationSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (orgName: string, userName: string) => {
    if (!userId) return;

    try {
      await OrganizationService.createOrganization(orgName, userId, userName);
      await loadUserProfile();
      toast({
        title: "Organização criada",
        description: "Sua organização foi criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      toast({
        title: "Erro ao criar organização",
        description: "Falha ao criar a organização",
        variant: "destructive",
      });
    }
  };

  const joinOrganization = async (orgName: string, userName: string) => {
    if (!userId) return;

    try {
      await OrganizationService.joinOrganization(orgName, userId, userName);
      await loadUserProfile();
      toast({
        title: "Ingressou na organização",
        description: "Você agora faz parte da organização",
      });
    } catch (error) {
      console.error('Erro ao ingressar na organização:', error);
      toast({
        title: "Erro ao ingressar",
        description: "Organização não encontrada ou erro ao ingressar",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'name'>>) => {
    if (!userId) return;

    try {
      await OrganizationService.updateUserProfile(userId, updates);
      await loadUserProfile();
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas",
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao atualizar o perfil",
        variant: "destructive",
      });
    }
  };

  const updateOrganizationSettings = async (updates: Partial<Pick<OrganizationSettings, 'whatsapp_default_message'>>) => {
    if (!userProfile?.organization_id) return;

    try {
      await OrganizationService.updateOrganizationSettings(userProfile.organization_id, updates);
      await loadUserProfile();
      toast({
        title: "Configurações atualizadas",
        description: "As configurações da organização foram salvas",
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao atualizar as configurações",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  return {
    userProfile,
    organizationSettings,
    loading,
    createOrganization,
    joinOrganization,
    updateProfile,
    updateOrganizationSettings
  };
};
