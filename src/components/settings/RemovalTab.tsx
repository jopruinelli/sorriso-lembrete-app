
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface RemovalTabProps {
  onShowPatientRemoval: () => void;
}

export const RemovalTab: React.FC<RemovalTabProps> = ({ onShowPatientRemoval }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Remoção de Pacientes</CardTitle>
        <CardDescription>
          Gerencie e remova pacientes do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onShowPatientRemoval}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Gerenciar Remoção de Pacientes
        </Button>
      </CardContent>
    </Card>
  );
};
