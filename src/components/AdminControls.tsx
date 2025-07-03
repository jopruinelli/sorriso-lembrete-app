
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Patient } from '@/types/patient';

interface AdminControlsProps {
  patients: Patient[];
  onDeletePatient: (patientId: string) => void;
  onBulkDelete: (patientIds: string[]) => void;
  onClose: () => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({
  patients,
  onDeletePatient,
  onBulkDelete,
  onClose
}) => {
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedPatients.length > 0) {
      onBulkDelete(selectedPatients);
      setSelectedPatients([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-red-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Painel Administrativo
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Atenção!</p>
                <p className="text-red-600 text-sm">
                  As exclusões são permanentes e não podem ser desfeitas.
                </p>
              </div>
            </div>

            {selectedPatients.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                <Badge variant="destructive" className="mr-2">
                  {selectedPatients.length} selecionado(s)
                </Badge>
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  variant="destructive"
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir Selecionados
                </Button>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <div className="space-y-2 p-4">
                {patients.map(patient => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      selectedPatients.includes(patient.id)
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectPatient(patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                            {patient.status === 'active' ? 'Ativo' : patient.status === 'inactive' ? 'Inativo' : 'Encerrados'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {patient.contactHistory.length} contatos
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => handleSelectPatient(patient.id)}
                          className="w-4 h-4"
                        />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePatient(patient.id);
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
