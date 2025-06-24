
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/organization';

interface OrganizationTabProps {
  userProfile: UserProfile | null;
}

export const OrganizationTab: React.FC<OrganizationTabProps> = ({ userProfile }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Informações da Organização</CardTitle>
        <CardDescription>
          Detalhes sobre sua organização
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Nome da Organização</Label>
          <Input 
            value={(userProfile as any)?.organizations?.name || ''} 
            disabled 
            className="bg-gray-50"
          />
        </div>
        <div>
          <Label>Tipo de Conta</Label>
          <div className="mt-2">
            <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
              {userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}
            </Badge>
          </div>
        </div>
        {userProfile?.role === 'admin' && (
          <p className="text-sm text-dental-secondary">
            Como administrador, você tem acesso a todas as configurações da organização.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
