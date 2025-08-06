-- Verificar e corrigir políticas RLS para permitir que admins alterem roles de outros usuários

-- 1. Adicionar política para permitir que admins façam UPDATE em user_profiles de outros usuários
DROP POLICY IF EXISTS "user_profiles_update_admin_role" ON public.user_profiles;

CREATE POLICY "user_profiles_update_admin_role" 
ON public.user_profiles 
FOR UPDATE 
USING (
  -- Permitir que admins da mesma organização atualizem roles de outros usuários
  EXISTS (
    SELECT 1 
    FROM public.user_profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.organization_id = user_profiles.organization_id 
    AND admin_profile.role = 'admin'
    AND admin_profile.status = 'approved'
  )
);

-- 2. Adicionar política para permitir que admins façam DELETE em user_profiles de outros usuários
DROP POLICY IF EXISTS "user_profiles_delete_admin" ON public.user_profiles;

CREATE POLICY "user_profiles_delete_admin" 
ON public.user_profiles 
FOR DELETE 
USING (
  -- Permitir que admins da mesma organização removam outros usuários
  EXISTS (
    SELECT 1 
    FROM public.user_profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.organization_id = user_profiles.organization_id 
    AND admin_profile.role = 'admin'
    AND admin_profile.status = 'approved'
  )
);