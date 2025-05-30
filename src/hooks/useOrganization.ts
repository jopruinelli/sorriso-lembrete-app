
import { useState, useEffect } from 'react';
import { UserProfile, OrganizationSettings } from '@/types/organization';
import { OrganizationService } from '@/services/organizationService';
import { useToast } from '@/hooks/use-toast';

export const useOrganization = (userId: string | undefined) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setUserProfile(null);
    setOrganizationSettings(null);
    setHasError(false);
  };

  const loadUserProfile = async () => {
    if (!userId) {
      console.log('🔄 No userId provided, resetting state');
      resetState();
      setLoading(false);
      return;
    }

    try {
      console.log(`🔄 Loading user profile for userId: ${userId}`);
      setHasError(false);
      
      const profile = await OrganizationService.getUserProfile(userId);
      console.log('✅ User profile loaded:', profile);
      
      setUserProfile(profile);

      if (profile?.organization_id) {
        console.log('🔄 Loading organization settings for org:', profile.organization_id);
        try {
          const settings = await OrganizationService.getOrganizationSettings(profile.organization_id);
          console.log('✅ Organization settings loaded:', settings);
          setOrganizationSettings(settings);
        } catch (settingsError) {
          console.warn('⚠️ Failed to load organization settings, but continuing:', settingsError);
          setOrganizationSettings(null);
        }
      } else {
        console.log('ℹ️ No organization_id found, clearing settings');
        setOrganizationSettings(null);
      }
      
    } catch (error) {
      console.error(`❌ Error loading profile:`, error);
      setHasError(true);
      setUserProfile(null);
      setOrganizationSettings(null);
      
      // Only show toast for unexpected errors, not RLS errors
      const errorMessage = error?.message || '';
      const isRLSError = errorMessage.includes('infinite recursion') || 
                        errorMessage.includes('row-level security') ||
                        errorMessage.includes('policy');
      
      if (!isRLSError) {
        toast({
          title: "Problema temporário",
          description: "Não foi possível carregar os dados. Você pode continuar e tentar novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (orgName: string, userName: string) => {
    if (!userId) return;

    try {
      console.log('🏢 Creating organization:', orgName);
      await OrganizationService.createOrganization(orgName, userId, userName);
      await loadUserProfile();
      toast({
        title: "Organização criada",
        description: "Sua organização foi criada com sucesso",
      });
    } catch (error) {
      console.error('❌ Error creating organization:', error);
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
      console.log('🤝 Joining organization:', orgName);
      await OrganizationService.joinOrganization(orgName, userId, userName);
      await loadUserProfile();
      toast({
        title: "Ingressou na organização",
        description: "Você agora faz parte da organização",
      });
    } catch (error) {
      console.error('❌ Error joining organization:', error);
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
      console.error('❌ Error updating profile:', error);
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
      console.error('❌ Error updating organization settings:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao atualizar as configurações",
        variant: "destructive",
      });
    }
  };

  const retryLoadProfile = () => {
    setLoading(true);
    setHasError(false);
    loadUserProfile();
  };

  useEffect(() => {
    console.log('🔄 useOrganization effect triggered, userId:', userId);
    setLoading(true);
    loadUserProfile();
  }, [userId]);

  return {
    userProfile,
    organizationSettings,
    loading,
    hasError,
    createOrganization,
    joinOrganization,
    updateProfile,
    updateOrganizationSettings,
    retryLoadProfile
  };
};
