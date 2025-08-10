import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { ContactPeriod } from '@/types/patient';

type ReminderType = 'all' | 'appointment' | 'birthday' | 'contact';

interface ReminderFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: ReminderType;
  setTypeFilter: (type: ReminderType) => void;
  contactPeriodFilter: ContactPeriod | 'all';
  setContactPeriodFilter: (period: ContactPeriod | 'all') => void;
}

export const ReminderFilterBar: React.FC<ReminderFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  contactPeriodFilter,
  setContactPeriodFilter
}) => {
  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dental-secondary w-4 h-4" />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-dental-primary/30 focus:border-dental-primary"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40 border-dental-primary/30">
            <Bell className="w-4 h-4 mr-2 text-dental-primary" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="appointment">Consulta</SelectItem>
            <SelectItem value="birthday">Aniversário</SelectItem>
            <SelectItem value="contact">Retomada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={contactPeriodFilter} onValueChange={setContactPeriodFilter}>
          <SelectTrigger className="w-full sm:w-52 border-dental-primary/30">
            <CalendarIcon className="w-4 h-4 mr-2 text-dental-primary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="overdue">Atrasados</SelectItem>
            <SelectItem value="1month">1 mês</SelectItem>
            <SelectItem value="3months">3 meses</SelectItem>
            <SelectItem value="6months">6 meses</SelectItem>
            <SelectItem value="1year">1 ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export type { ReminderType };
