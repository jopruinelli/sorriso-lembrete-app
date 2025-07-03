
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { ContactPeriod } from '@/types/patient';

interface FilterBarProps {
  statusFilter: 'all' | 'active' | 'inactive' | 'closed';
  setStatusFilter: (status: 'all' | 'active' | 'inactive' | 'closed') => void;
  contactPeriodFilter: ContactPeriod | 'all';
  setContactPeriodFilter: (period: ContactPeriod | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paymentFilter: 'all' | 'particular' | 'convenio';
  setPaymentFilter: (payment: 'all' | 'particular' | 'convenio') => void;
  overdueFilter: boolean;
  setOverdueFilter: (overdue: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  setStatusFilter,
  contactPeriodFilter,
  setContactPeriodFilter,
  searchTerm,
  setSearchTerm,
  paymentFilter,
  setPaymentFilter,
  overdueFilter,
  setOverdueFilter
}) => {
  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dental-secondary w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-dental-primary/30 focus:border-dental-primary"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-dental-primary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="closed">Encerrados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={contactPeriodFilter} onValueChange={setContactPeriodFilter}>
          <SelectTrigger className="w-40 border-dental-primary/30">
            <Filter className="w-4 h-4 mr-2 text-dental-primary" />
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

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40 border-dental-primary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pagamentos</SelectItem>
            <SelectItem value="particular">Particular</SelectItem>
            <SelectItem value="convenio">Convênio</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={overdueFilter ? "default" : "outline"}
          onClick={() => setOverdueFilter(!overdueFilter)}
          className={overdueFilter 
            ? "bg-dental-primary hover:bg-dental-secondary whitespace-nowrap" 
            : "border-dental-primary text-dental-primary hover:bg-dental-background whitespace-nowrap"
          }
        >
          Apenas atrasados
        </Button>
      </div>
    </div>
  );
};
