import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { WhatsAppTab } from '@/components/settings/WhatsAppTab';
import { ImportTab } from '@/components/settings/ImportTab';
import { RemovalTab } from '@/components/settings/RemovalTab';
import { LocationsTab } from '@/components/settings/LocationsTab';
import { AppointmentTitlesTab } from '@/components/settings/AppointmentTitlesTab';
import { UserManagement } from '@/components/UserManagement';
import { UserProfile, OrganizationSettings } from '@/types/organization';

interface SettingsModalContentProps {
  userProfile: UserProfile | null;
  organizationSettings: OrganizationSettings | null;
  isAdmin: boolean;
  onUpdateProfile: (updates: { name: string }) => void;
  onUpdateSettings: (updates: { whatsapp_default_message: string }) => void;
  onShowExcelImport: () => void;
  onShowPatientRemoval: () => void;
  fetchLocations: () => Promise<void>;
  fetchTitles: () => Promise<void>;
}

export const SettingsModalContent: React.FC<SettingsModalContentProps> = ({
  userProfile,
  organizationSettings,
  isAdmin,
  onUpdateProfile,
  onUpdateSettings,
  onShowExcelImport,
  onShowPatientRemoval,
  fetchLocations,
  fetchTitles
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <TabsContent value="organization" className="space-y-4 mt-0">
        <OrganizationTab userProfile={userProfile} />
      </TabsContent>

      <TabsContent value="profile" className="space-y-4 mt-0">
        <ProfileTab 
          userProfile={userProfile}
          onUpdateProfile={onUpdateProfile}
        />
      </TabsContent>

      <TabsContent value="whatsapp" className="space-y-4 mt-0">
        <WhatsAppTab
          userProfile={userProfile}
          organizationSettings={organizationSettings}
          onUpdateSettings={onUpdateSettings}
        />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="locations" className="space-y-4 mt-0">
          <LocationsTab fetchLocations={fetchLocations} />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="titles" className="space-y-4 mt-0">
          <AppointmentTitlesTab fetchTitles={fetchTitles} />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="import" className="space-y-4 mt-0">
          <ImportTab onShowExcelImport={onShowExcelImport} />
        </TabsContent>
      )}

      <TabsContent value="removal" className="space-y-4 mt-0">
        <RemovalTab onShowPatientRemoval={onShowPatientRemoval} />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="users" className="space-y-4 mt-0">
          <UserManagement 
            organizationId={userProfile?.organization_id || ''}
            currentUserId={userProfile?.user_id || ''}
          />
        </TabsContent>
      )}
    </div>
  );
};