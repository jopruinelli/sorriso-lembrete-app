
import React, { useState } from 'react';
import { Patient, ContactPeriod } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: Omit<Patient, 'id' | 'contactHistory'>) => void;
  onCancel: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    phone: patient?.phone || '',
    secondaryPhone: patient?.secondaryPhone || '',
    lastVisit: patient?.lastVisit || new Date(),
    nextContactReason: patient?.nextContactReason || '',
    nextContactDate: patient?.nextContactDate || addMonths(new Date(), 6),
    status: patient?.status || 'active' as const,
    inactiveReason: patient?.inactiveReason || '',
    paymentType: patient?.paymentType || 'particular' as const
  });

  const [contactPeriod, setContactPeriod] = useState<ContactPeriod>('6months');

  const handleContactPeriodChange = (period: ContactPeriod) => {
    setContactPeriod(period);
    if (period !== 'custom') {
      let nextDate = new Date(formData.lastVisit);
      switch (period) {
        case '1month':
          nextDate = addMonths(nextDate, 1);
          break;
        case '6months':
          nextDate = addMonths(nextDate, 6);
          break;
        case '1year':
          nextDate = addYears(nextDate, 1);
          break;
      }
      setFormData(prev => ({ ...prev, nextContactDate: nextDate }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Digite o nome do paciente"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone principal *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="secondaryPhone">Telefone secundário</Label>
              <Input
                id="secondaryPhone"
                value={formData.secondaryPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryPhone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label>Data da última consulta *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.lastVisit && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.lastVisit ? format(formData.lastVisit, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.lastVisit}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, lastVisit: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Período para próximo contato</Label>
              <Select value={contactPeriod} onValueChange={handleContactPeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 mês</SelectItem>
                  <SelectItem value="6months">6 meses</SelectItem>
                  <SelectItem value="1year">1 ano</SelectItem>
                  <SelectItem value="custom">Data personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contactPeriod === 'custom' && (
              <div>
                <Label>Data do próximo contato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.nextContactDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.nextContactDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, nextContactDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div>
              <Label htmlFor="nextContactReason">Motivo do próximo contato *</Label>
              <Textarea
                id="nextContactReason"
                value={formData.nextContactReason}
                onChange={(e) => setFormData(prev => ({ ...prev, nextContactReason: e.target.value }))}
                required
                placeholder="Ex: Limpeza, Revisão, Tratamento de canal..."
                rows={3}
              />
            </div>

            <div>
              <Label>Tipo de atendimento</Label>
              <Select 
                value={formData.paymentType} 
                onValueChange={(value: 'particular' | 'convenio') => setFormData(prev => ({ ...prev, paymentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status do paciente</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'inactive' && (
              <div>
                <Label htmlFor="inactiveReason">Motivo da inativação</Label>
                <Textarea
                  id="inactiveReason"
                  value={formData.inactiveReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, inactiveReason: e.target.value }))}
                  placeholder="Ex: Mudou de cidade, foi para outra clínica..."
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Salvar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
