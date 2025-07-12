
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Patient } from '@/types/patient';
import { Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientRemovalProps {
  patients: Patient[];
  onDeletePatient: (patientId: string) => void;
  onBulkDelete: (patientIds: string[]) => void;
  onClose: () => void;
}

export const PatientRemoval: React.FC<PatientRemovalProps> = ({
  patients,
  onDeletePatient,
  onBulkDelete,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    patientId?: string;
    patientName?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'single'
  });

  const filteredPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId]);
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(filteredPatients.map(p => p.id));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedPatients.length > 0) {
      setConfirmDialog({
        isOpen: true,
        type: 'bulk',
        count: selectedPatients.length
      });
    }
  };

  const handleSingleDelete = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      patientId,
      patientName: patient?.name
    });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.type === 'single' && confirmDialog.patientId) {
      onDeletePatient(confirmDialog.patientId);
      setSelectedPatients(prev => prev.filter(id => id !== confirmDialog.patientId));
    } else if (confirmDialog.type === 'bulk') {
      onBulkDelete(selectedPatients);
      setSelectedPatients([]);
    }
    setConfirmDialog({ isOpen: false, type: 'single' });
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, type: 'single' });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <Trash2 className="w-5 h-5 text-dental-primary" />
          <h2 className="text-lg font-semibold text-dental-primary">Remoção de Pacientes</h2>
        </div>

      <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={filteredPatients.length > 0 && selectedPatients.length === filteredPatients.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Selecionar todos ({filteredPatients.length})
              </label>
            </div>
            {selectedPatients.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover {selectedPatients.length} selecionados
              </Button>
            )}
          </div>

          {/* Patient List */}
          <ScrollArea className="flex-1 h-96">
            <div className="space-y-2">
              {filteredPatients.map(patient => (
                <Card key={patient.id} className="border-dental-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={(checked) => handleSelectPatient(patient.id, checked as boolean)}
                        />
                        <div>
                          <h3 className="font-semibold text-dental-primary">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-dental-secondary">
                            {patient.phone}
                          </p>
                          <p className="text-xs text-dental-secondary">
                            Última consulta: {format(patient.lastVisit, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSingleDelete(patient.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-dental-secondary">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'single' ? 'Confirmar Exclusão' : 'Confirmar Exclusão em Massa'}
        message={
          confirmDialog.type === 'single'
            ? `Tem certeza que deseja excluir o paciente "${confirmDialog.patientName}"? Esta operação não pode ser desfeita.`
            : `Tem certeza que deseja excluir ${confirmDialog.count} pacientes selecionados? Esta operação não pode ser desfeita.`
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
