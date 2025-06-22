
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, UserPlus } from 'lucide-react';

interface OnboardingFlowProps {
  onCreateOrganization: (orgName: string) => void;
  onJoinOrganization: (orgName: string) => void;
  userEmail?: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onCreateOrganization,
  onJoinOrganization,
  userEmail
}) => {
  const [orgName, setOrgName] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    if (activeTab === 'create') {
      onCreateOrganization(orgName.trim());
    } else {
      onJoinOrganization(orgName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-dental-primary">
            Bem-vindo ao Sistema
          </CardTitle>
          <p className="text-dental-secondary">
            Conectado como: {userEmail}
          </p>
          <p className="text-dental-secondary text-sm">
            Configure sua organização para começar
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Building2 className="w-4 h-4 mr-2" />
                Criar
              </TabsTrigger>
              <TabsTrigger value="join">
                <UserPlus className="w-4 h-4 mr-2" />
                Ingressar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="text-center mb-4">
                <Users className="w-12 h-12 mx-auto text-dental-primary mb-2" />
                <h3 className="font-semibold text-dental-primary">
                  Criar Nova Organização
                </h3>
                <p className="text-sm text-dental-secondary">
                  Crie uma nova organização e gerencie usuários
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Nome da Organização</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: JMCorp"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-dental-primary hover:bg-dental-secondary"
                  disabled={!orgName.trim()}
                >
                  Criar Organização
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="text-center mb-4">
                <UserPlus className="w-12 h-12 mx-auto text-dental-primary mb-2" />
                <h3 className="font-semibold text-dental-primary">
                  Ingressar em Organização
                </h3>
                <p className="text-sm text-dental-secondary">
                  Solicite acesso a uma organização existente
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="orgNameJoin">Nome da Organização</Label>
                  <Input
                    id="orgNameJoin"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Nome exato da organização (ex: JMCorp)"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-dental-primary hover:bg-dental-secondary"
                  disabled={!orgName.trim()}
                >
                  Solicitar Acesso
                </Button>
              </form>
              <p className="text-xs text-dental-secondary text-center">
                Sua solicitação será enviada para aprovação do administrador
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
