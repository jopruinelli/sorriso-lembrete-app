
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';

interface ImportTabProps {
  onShowExcelImport: () => void;
}

export const ImportTab: React.FC<ImportTabProps> = ({ onShowExcelImport }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Importação de Pacientes</CardTitle>
        <CardDescription>
          Importe pacientes em massa a partir de planilhas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onShowExcelImport}
          className="w-full bg-dental-primary hover:bg-dental-secondary"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Importar Planilha
        </Button>
      </CardContent>
    </Card>
  );
};
