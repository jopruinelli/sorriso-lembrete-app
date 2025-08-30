import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientCreateData, ContactPeriod } from '@/types/patient';
import { DatePickerField } from './DatePickerField';
import { PeriodSelector } from './PeriodSelector';

interface Location {
  id: string;
  name: string;
}

interface PatientFormFieldsProps {
  formData: PatientCreateData;
  onChange: <K extends keyof PatientCreateData>(field: K, value: PatientCreateData[K]) => void;
  onPeriodChange: (period: ContactPeriod) => void;
  locations?: Location[];
}

export const PatientFormFields: React.FC<PatientFormFieldsProps> = ({
  formData,
  onChange,
  onPeriodChange,
  locations = []
}) => {
  return (
    <>
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
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
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="(11) 99999-9999"
            required
          />
        </div>
        <div>
          <Label htmlFor="secondaryPhone">Telefone 2</Label>
          <Input
            id="secondaryPhone"
            value={formData.secondaryPhone}
            onChange={(e) => onChange('secondaryPhone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <DatePickerField
        label="Data de Nascimento"
        value={formData.birthDate}
        onSelect={(date) => onChange('birthDate', date)}
      />

      <DatePickerField
        label="Última Consulta"
        value={formData.lastVisit}
        onSelect={(date) => onChange('lastVisit', date)}
        required
      />

      <div>
        <Label htmlFor="nextContactReason">Motivo do Próximo Contato</Label>
        <Textarea
          id="nextContactReason"
          value={formData.nextContactReason}
          onChange={(e) => onChange('nextContactReason', e.target.value)}
          placeholder="Ex: Limpeza, revisão, tratamento..."
          rows={2}
        />
      </div>

      <PeriodSelector onPeriodChange={onPeriodChange} />

      <DatePickerField
        label="Data do Próximo Contato"
        value={formData.nextContactDate}
        onSelect={(date) => onChange('nextContactDate', date)}
        required
      />

      <div>
        <Label htmlFor="locationId">Local / Clínica *</Label>
        <Select
          value={formData.locationId}
          defaultValue={formData.locationId}
          onValueChange={(value) => onChange('locationId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar local" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentType">Tipo de Pagamento</Label>
          <Select 
            value={formData.paymentType} 
            onValueChange={(value: 'particular' | 'convenio') => onChange('paymentType', value)}
          >
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
          <Select 
            value={formData.status} 
            onValueChange={(value: 'active' | 'inactive' | 'closed') => onChange('status', value)}
          >
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
          <Label htmlFor="inactiveReason">
            {formData.status === 'closed' ? 'Motivo do Encerramento' : 'Motivo da Inativação'}
          </Label>
          <Textarea
            id="inactiveReason"
            value={formData.inactiveReason}
            onChange={(e) => onChange('inactiveReason', e.target.value)}
            placeholder="Descreva o motivo..."
            rows={2}
          />
        </div>
      )}
    </>
  );
};