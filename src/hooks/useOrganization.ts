
import { useState, useEffect } from 'react';
import { UserProfile, OrganizationSettings } from '@/types/organization';
import { OrganizationService } from '@/services/organizationService';
import { UserProfileService } from '@/services/userProfileService';
import { OrganizationSettingsService } from '@/services/organizationSettingsService';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useOrganization = (user: User | null) => {
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
    if (!user?.id) {
      console.log('🔄 No user provided, resetting state');
      resetState();
      setLoading(false);
      return;
    }

    try {
      console.log(`🔄 Loading user profile for userId: ${user.id}`);
      setHasError(false);
      
      const profile = await UserProfileService.getUserProfile(user.id);
      console.log('✅ User profile loaded:', profile);

      if (profile?.status === 'rejected') {
        console.log('🚫 User profile rejected, signing out');
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Sua solicitação de acesso foi rejeitada pelo administrador.",
          variant: "destructive",
        });
        resetState();
        setLoading(false);
        return;
      }

      setUserProfile(profile);

      if (profile?.organization_id) {
        console.log('🔄 Loading organization settings for org:', profile.organization_id);
        try {
          const settings = await OrganizationSettingsService.getOrganizationSettings(profile.organization_id);
          console.log('✅ Organization settings loaded:', settings);
          setOrganizationSettings(
            settings
              ? {
                  ...settings,
                  working_hours_start: Number(settings.working_hours_start),
                  working_hours_end: Number(settings.working_hours_end),
                }
              : null
          );
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

  const createOrganization = async (orgName: string) => {
    if (!user?.id || !user?.user_metadata?.full_name) return;

    try {
      console.log('🏢 Creating organization:', orgName);
      const userName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário';
      
      // Verificar se é admin (jopruinelli@gmail.com)
      const isMainAdmin = user.email === 'jopruinelli@gmail.com';
      
      await OrganizationService.createOrganization(orgName, user.id, userName, isMainAdmin);
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

  const joinOrganization = async (orgName: string) => {
    if (!user?.id || !user?.user_metadata?.full_name) return;

    try {
      console.log('🤝 Joining organization:', orgName);
      const userName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário';
      
      await OrganizationService.joinOrganization(orgName, user.id, userName);
      await loadUserProfile();
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada para aprovação",
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
    if (!user?.id) return;

    try {
      await UserProfileService.updateUserProfile(user.id, updates);
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

  const updateOrganizationSettings = async (
    updates: Partial<Pick<OrganizationSettings, 'whatsapp_default_message' | 'working_hours_start' | 'working_hours_end'>>
  ) => {
    if (!userProfile?.organization_id) return;

    try {
      await OrganizationSettingsService.updateOrganizationSettings(userProfile.organization_id, updates);
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
    console.log('🔄 useOrganization effect triggered, user:', user?.email);
    setLoading(true);
    loadUserProfile();
  }, [user?.id]);

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
