
import { sanitizeUserName, sanitizeOrganizationName } from '@/utils/inputSanitization';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';
import { OrganizationSettingsService } from './organizationSettingsService';

export class OrganizationService {
  static async createOrganization(name: string, userId: string, userName: string, isMainAdmin: boolean = false): Promise<Organization> {
    console.log('🏢 OrganizationService.createOrganization:', { name, userId, userName, isMainAdmin });
    
    try {
      // Sanitize inputs
      const sanitizedName = sanitizeOrganizationName(name);
      const sanitizedUserName = sanitizeUserName(userName);
      
      console.log('✅ Inputs sanitized:', { sanitizedName, sanitizedUserName });
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: sanitizedName }])
        .select()
        .single();

      if (orgError) {
        console.error('❌ Error creating organization:', orgError);
        throw orgError;
      }

      console.log('✅ Organization created:', orgData);

      // Create user profile as admin
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          organization_id: orgData.id,
          name: sanitizedUserName,
          role: 'admin',
          status: 'approved' // Auto-aprovado para quem cria a organização
        }])
        .select();

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as admin');

      // Create default organization settings
      await OrganizationSettingsService.createDefaultSettings(orgData.id);

      return orgData;
    } catch (error) {
      console.error('❌ OrganizationService.createOrganization failed:', error);
      throw error;
    }
  }

  static async joinOrganization(organizationName: string, userId: string, userName: string): Promise<Organization> {
    console.log('🤝 OrganizationService.joinOrganization:', { organizationName, userId, userName });
    
    try {
      // Sanitize inputs
      const sanitizedOrgName = sanitizeOrganizationName(organizationName);
      const sanitizedUserName = sanitizeUserName(userName);
      
      console.log('✅ Inputs sanitized for join:', { sanitizedOrgName, sanitizedUserName });
      // Debug: First let's see all organizations
      const { data: allOrgs, error: allOrgsError } = await supabase
        .from('organizations')
        .select('*');
      
      console.log('🔍 All organizations in database:', allOrgs);
      if (allOrgsError) {
        console.error('❌ Error fetching all organizations:', allOrgsError);
      }

      // Find organization by name (case-insensitive search)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .ilike('name', sanitizedOrgName)
        .maybeSingle();

      console.log('🔍 Organization search result:', { orgData, orgError, searchTerm: organizationName });

      if (orgError) {
        console.error('❌ Error searching for organization:', orgError);
        throw orgError;
      }

      if (!orgData) {
        console.error('❌ Organization not found:', organizationName);
        console.log('Available organizations:', allOrgs?.map(org => org.name) || []);
        throw new Error(`Organização "${organizationName}" não encontrada. Verifique se o nome está correto.`);
      }

      console.log('✅ Organization found:', orgData);

      // Check if user is already in this organization
      const { data: existingProfile, error: existingError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', orgData.id)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Error checking existing profile:', existingError);
        throw existingError;
      }

      if (existingProfile) {
        console.log('ℹ️ User already has profile in this organization:', existingProfile);
        throw new Error('Você já está vinculado a esta organização.');
      }

      // Create user profile with pending status
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          organization_id: orgData.id,
          name: sanitizedUserName,
          role: 'user',
          status: 'pending' // Aguardando aprovação
        }])
        .select();

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created as pending user');
      return orgData;
    } catch (error) {
      console.error('❌ OrganizationService.joinOrganization failed:', error);
      throw error;
    }
  }
}
