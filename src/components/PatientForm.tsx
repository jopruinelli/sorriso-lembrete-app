import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Patient, ContactPeriod, PatientCreateData } from '@/types/patient';
import { CalendarIcon, X } from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: PatientCreateData) => void;
  onCancel: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState<PatientCreateData>({
    name: '',
    phone: '',
    secondaryPhone: '',
    birthDate: undefined,
    lastVisit: new Date(),
    nextContactReason: '',
    nextContactDate: new Date(),
    status: 'active' as 'active' | 'inactive' | 'closed',
    inactiveReason: '',
    paymentType: 'particular' as 'particular' | 'convenio'
  });

  const [lastVisitOpen, setLastVisitOpen] = useState(false);
  const [nextContactOpen, setNextContactOpen] = useState(false);
  const [birthOpen, setBirthOpen] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        phone: patient.phone,
        secondaryPhone: patient.secondaryPhone || '',
        birthDate: patient.birthDate,
        lastVisit: patient.lastVisit,
        nextContactReason: patient.nextContactReason,
        nextContactDate: patient.nextContactDate,
        status: patient.status,
        inactiveReason: patient.inactiveReason || '',
        paymentType: patient.paymentType
      });
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = <K extends keyof PatientCreateData>(
    field: K,
    value: PatientCreateData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePeriodChange = (period: ContactPeriod) => {
    let nextDate = new Date(formData.lastVisit);
    
    switch (period) {
      case '1month':
        nextDate = addMonths(formData.lastVisit, 1);
        break;
      case '3months':
        nextDate = addMonths(formData.lastVisit, 3);
        break;
      case '6months':
        nextDate = addMonths(formData.lastVisit, 6);
        break;
      case '1year':
        nextDate = addMonths(formData.lastVisit, 12);
        break;
      default:
        return;
    }
    
    handleChange('nextContactDate', nextDate);
  };

  const handleLastVisitSelect = (date: Date | undefined) => {
    if (date) {
      handleChange('lastVisit', date);
      setLastVisitOpen(false); // Fechar calendário automaticamente
    }
  };

  const handleBirthSelect = (date: Date | undefined) => {
    if (date) {
      handleChange('birthDate', date);
      setBirthOpen(false);
    }
  };

  const handleNextContactSelect = (date: Date | undefined) => {
    if (date) {
      handleChange('nextContactDate', date);
      setNextContactOpen(false); // Fechar calendário automaticamente
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dental-primary flex items-center justify-between">
            <span>{patient ? 'Editar Paciente' : 'Novo Paciente'}</span>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome completo do paciente"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          <div>
            <Label htmlFor="secondaryPhone">Telefone 2</Label>
            <Input
              id="secondaryPhone"
              value={formData.secondaryPhone}
              onChange={(e) => handleChange('secondaryPhone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div>
          <Label>Data de Nascimento</Label>
          <Popover open={birthOpen} onOpenChange={setBirthOpen}>
            <PopoverTrigger asChild>
              <Input
                type="date"
                value={formData.birthDate ? format(formData.birthDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleBirthSelect(e.target.value ? new Date(e.target.value) : undefined)}
                onFocus={() => setBirthOpen(true)}
                className="w-full"
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.birthDate}
                onSelect={handleBirthSelect}
                captionLayout="dropdown"
                fromYear={1900}
                toYear={new Date().getFullYear() + 10}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

          <div>
            <Label>Última Consulta *</Label>
            <Popover open={lastVisitOpen} onOpenChange={setLastVisitOpen}>
              <PopoverTrigger asChild>
                <Input
                  type="date"
                  value={formData.lastVisit ? format(formData.lastVisit, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleLastVisitSelect(e.target.value ? new Date(e.target.value) : undefined)}
                  onFocus={() => setLastVisitOpen(true)}
                  className="w-full"
                  required
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.lastVisit}
                  onSelect={handleLastVisitSelect}
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear() + 10}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="nextContactReason">Motivo do Próximo Contato *</Label>
            <Textarea
              id="nextContactReason"
              value={formData.nextContactReason}
              onChange={(e) => handleChange('nextContactReason', e.target.value)}
              placeholder="Ex: Limpeza, revisão, tratamento..."
              rows={2}
              required
            />
          </div>

          <div>
            <Label>Período para Próximo Contato</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePeriodChange('1month')}
                className="text-xs"
              >
                1 mês
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePeriodChange('3months')}
                className="text-xs"
              >
                3 meses
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePeriodChange('6months')}
                className="text-xs"
              >
                6 meses
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePeriodChange('1year')}
                className="text-xs"
              >
                1 ano
              </Button>
            </div>
          </div>

          <div>
            <Label>Data do Próximo Contato *</Label>
            <Popover open={nextContactOpen} onOpenChange={setNextContactOpen}>
              <PopoverTrigger asChild>
                <Input
                  type="date"
                  value={formData.nextContactDate ? format(formData.nextContactDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleNextContactSelect(e.target.value ? new Date(e.target.value) : undefined)}
                  onFocus={() => setNextContactOpen(true)}
                  className="w-full"
                  required
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.nextContactDate}
                  onSelect={handleNextContactSelect}
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear() + 10}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentType">Tipo de Pagamento</Label>
              <Select value={formData.paymentType} onValueChange={(value: 'particular' | 'convenio') => handleChange('paymentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'closed') => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="closed">Encerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.status === 'inactive' || formData.status === 'closed') && (
            <div>
              <Label htmlFor="inactiveReason">{formData.status === 'closed' ? 'Motivo do Encerramento' : 'Motivo da Inativação'}</Label>
              <Textarea
                id="inactiveReason"
                value={formData.inactiveReason}
                onChange={(e) => handleChange('inactiveReason', e.target.value)}
                placeholder="Descreva o motivo..."
                rows={2}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-dental-primary hover:bg-dental-secondary"
              disabled={!formData.name || !formData.phone || !formData.nextContactReason}
            >
              {patient ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
