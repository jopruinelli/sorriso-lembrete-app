
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, UserPlus } from 'lucide-react';

interface OnboardingFlowProps {
  onCreateOrganization: (orgName: string, userName: string) => void;
  onJoinOrganization: (orgName: string, userName: string) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onCreateOrganization,
  onJoinOrganization
}) => {
  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !userName.trim()) return;

    if (activeTab === 'create') {
      onCreateOrganization(orgName.trim(), userName.trim());
    } else {
      onJoinOrganization(orgName.trim(), userName.trim());
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
                  Crie uma nova organização e convide outros usuários
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Nome da Organização</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: Clínica Sorriso"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="userName">Seu Nome</Label>
                  <Input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-dental-primary hover:bg-dental-secondary"
                  disabled={!orgName.trim() || !userName.trim()}
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
                  Entre em uma organização existente
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="orgNameJoin">Nome da Organização</Label>
                  <Input
                    id="orgNameJoin"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Nome exato da organização"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="userNameJoin">Seu Nome</Label>
                  <Input
                    id="userNameJoin"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-dental-primary hover:bg-dental-secondary"
                  disabled={!orgName.trim() || !userName.trim()}
                >
                  Ingressar na Organização
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
