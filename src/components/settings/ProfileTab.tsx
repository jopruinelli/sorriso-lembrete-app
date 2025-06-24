
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/types/organization';

interface ProfileTabProps {
  userProfile: UserProfile | null;
  onUpdateProfile: (updates: { name: string }) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ userProfile, onUpdateProfile }) => {
  const [userName, setUserName] = useState(userProfile?.name || '');

  useEffect(() => {
    setUserName(userProfile?.name || '');
  }, [userProfile]);

  const handleSaveProfile = () => {
    onUpdateProfile({ name: userName });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Perfil do Usuário</CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="userName">Nome</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Seu nome completo"
          />
        </div>
        <Button 
          onClick={handleSaveProfile}
          className="bg-dental-primary hover:bg-dental-secondary"
          disabled={!userName.trim() || userName === userProfile?.name}
        >
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
};
